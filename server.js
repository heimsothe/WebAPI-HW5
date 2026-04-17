require('dotenv').config();

/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var mongoose = require('mongoose');
var crypto = require('crypto');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.status(409).json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movies = await Movie.find();
            res.status(200).json(movies);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, msg: 'Something went wrong.' });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        if (!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors) {
            return res.status(400).json({
                success: false,
                msg: 'Please include title, releaseDate, genre, and actors.'
            });
        }

        if (req.body.actors.length < 3) {
            return res.status(400).json({
                success: false,
                msg: 'Movies must have at least 3 actors.'
            });
        }

        try {
            const movie = new Movie({
                title: req.body.title,
                releaseDate: req.body.releaseDate,
                genre: req.body.genre,
                actors: req.body.actors,
            });

            const savedMovie = await movie.save();
            res.status(200).json({ movie: savedMovie });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, msg: 'Something went wrong.' });
        }
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        res.status(405).json({ success: false, msg: 'PUT not supported on /movies. Use /movies/:id.' });
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        res.status(405).json({ success: false, msg: 'DELETE not supported on /movies. Use /movies/:id.' });
    });

router.route('/movies/:id')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            if (req.query.reviews === 'true') {
                const result = await Movie.aggregate([
                    { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
                    {
                        $lookup: {
                            from: 'reviews',
                            localField: '_id',
                            foreignField: 'movieId',
                            as: 'reviews'
                        }
                    }
                ]);

                if (!result || result.length === 0) {
                    return res.status(404).json({ success: false, msg: 'Movie not found.' });
                }

                return res.status(200).json(result[0]);
            }

            const movie = await Movie.findById(req.params.id);

            if (!movie) {
                return res.status(404).json({ success: false, msg: 'Movie not found.' });
            }

            res.status(200).json(movie);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, msg: 'Something went wrong.' });
        }
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );

            if (!movie) {
                return res.status(404).json({ success: false, msg: 'Movie not found.' });
            }

            res.status(200).json({ success: true, msg: 'Movie updated.', movie: movie });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, msg: 'Something went wrong.' });
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const movie = await Movie.findByIdAndDelete(req.params.id);

            if (!movie) {
                return res.status(404).json({ success: false, msg: 'Movie not found.' });
            }

            // Clean up any reviews associated with the deleted movie
            await Review.deleteMany({ movieId: req.params.id });

            res.status(200).json({ success: true, msg: 'Movie deleted.', movie: movie });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, msg: 'Something went wrong.' });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        res.status(405).json({ success: false, msg: 'POST not supported on /movies/:id. Use POST /movies.' });
    });

function trackDimension(category, action, label, value, dimension, metric) {
    var GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
    var GA_API_SECRET = process.env.GA_API_SECRET;

    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) return;

    fetch(
        'https://www.google-analytics.com/mp/collect?measurement_id=' +
        GA_MEASUREMENT_ID + '&api_secret=' + GA_API_SECRET,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: crypto.randomUUID(),
                events: [{
                    name: 'movie_review',
                    params: {
                        event_category: category,
                        event_action: action,
                        event_label: label,
                        event_value: value,
                        movie_name: dimension,
                        requested: metric
                    }
                }]
            })
        }
    );
}

router.post('/reviews', authJwtController.isAuthenticated, async (req, res) => {
    try {
        if (!req.body.movieId) {
            return res.status(400).json({ success: false, msg: 'Please include a movieId.' });
        }

        const movie = await Movie.findById(req.body.movieId);

        if (!movie) {
            return res.status(404).json({ success: false, msg: 'Movie not found.' });
        }

        const review = new Review({
            movieId: req.body.movieId,
            username: req.user.username,
            review: req.body.review,
            rating: req.body.rating,
        });

        await review.save();
        trackDimension(
            movie.genre,
            'post /reviews',
            'API Request for Movie Review',
            1,
            movie.title,
            1
        );
        res.status(200).json({ message: 'Review created!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Something went wrong.' });
    }
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


