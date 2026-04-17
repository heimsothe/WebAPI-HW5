let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
let Movie = require('../Movies');
let Review = require('../Reviews');
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test2',
    username: 'email2@email.com',
    password: '123@abc'
}

let review_details = {
    movieId: '',
    review: 'great movie - 0e65db9f-40db-4511-bbbe-c484f69e3032',
    rating: 1
}

let token = ''
let movieId = null

describe('Test Review Routes', () => {
   before((done) => { //Before  test initialize the database to empty
        User.deleteOne({ name: 'test2'}, function(err, user) {
            if (err) throw err;
        });
       
        Movie.deleteOne({ title: 'Alice in Wonderland'}, function(err, movie) {
            if (err) throw err;
        });

        Review.deleteOne({ review: review_details.review }, function(err, review) {
            if (err) throw err;
        });
       done();
    })

    after((done) => { //after this test suite empty the database
        User.deleteOne({ name: 'test2'}, function(err, user) {
            if (err) throw err;
        });
       
        Movie.deleteOne({ title: 'Alice in Wonderland'}, function(err, user) {
            if (err) throw err;
        });
        Review.deleteOne({ review: review_details.review }, function(err, review) {
            if (err) throw err;
        });
        done();
    })

    describe('/signup', () => {
        it('it should register, login and check our token', (done) => {
          chai.request(server)
              .post('/signup')
              .send(login_details)
              .end((err, res) =>{
                res.should.have.status(200);
                res.body.success.should.be.eql(true);
                //follow-up to get the JWT token
                chai.request(server)
                    .post('/signin')
                    .send(login_details)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        token = res.body.token;
                        done();
                    })
              })
        })
    });

    //Test the GET route
    describe('GET Movies', () => {
        it('it return all movies', (done) => {
            chai.request(server)
                .get('/movies')
                .set('Authorization', token)
                .send()
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.forEach(movie => {
                        movie.should.have.property('_id')
                        review_details.movieId = movie._id //the last one
                        movie.should.have.property('title')
                        movie.should.have.property('releaseDate')
                        movie.should.have.property('genre')
                        movie.should.have.property('actors')
                    });
                    done();
                })
        })
    });

    //Test the Review route
    describe('Review Movies', () => {
        it('it reviews a movies', (done) => {
            chai.request(server)
                .post('/reviews')
                .set('Authorization', token)
                .send(review_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.message.should.eq('Review created!')
                    done();
                })
        })
    });

    describe('GET Movie Detail with reviews', () => {
        it('it should return a movie with avgRating and reviews array', (done) => {
            chai.request(server)
                .get('/movies/' + review_details.movieId + '?reviews=true')
                .set('Authorization', token)
                .send()
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('title');
                    res.body.should.have.property('avgRating');
                    res.body.avgRating.should.be.a('number');
                    res.body.should.have.property('reviews');
                    res.body.reviews.should.be.an('array');
                    res.body.reviews.length.should.be.at.least(1);
                    done();
                })
        });

        it('it should return a movie WITHOUT reviews when flag is absent', (done) => {
            chai.request(server)
                .get('/movies/' + review_details.movieId)
                .set('Authorization', token)
                .send()
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('title');
                    res.body.should.have.property('avgRating');
                    res.body.should.not.have.property('reviews');
                    done();
                })
        });

        it('it should return 404 for a nonexistent movie', (done) => {
            chai.request(server)
                .get('/movies/507f1f77bcf86cd799439011?reviews=true')
                .set('Authorization', token)
                .send()
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                })
        });
    });

    describe('POST /reviews security', () => {
        it('it should return 401 without a token', (done) => {
            chai.request(server)
                .post('/reviews')
                .send({ movieId: review_details.movieId, review: 'test', rating: 3 })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                })
        });

        it('it should use JWT username, not body username', (done) => {
            let attackReview = {
                movieId: review_details.movieId,
                review: 'attacker review - security test',
                rating: 5,
                username: 'attacker'
            };
            chai.request(server)
                .post('/reviews')
                .set('Authorization', token)
                .send(attackReview)
                .end((err, res) => {
                    res.should.have.status(200);
                    Review.findOne({ review: attackReview.review }).lean().then(function(saved) {
                        saved.username.should.eq(login_details.username);
                        saved.username.should.not.eq('attacker');
                        // Cleanup
                        Review.deleteOne({ review: attackReview.review }).then(function() {
                            done();
                        });
                    });
                })
        });
    });
});
