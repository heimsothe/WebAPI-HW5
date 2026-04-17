/*
- File: Movies.js
- Author: Elijah Heimsoth
- Date: 04/15/2026
- Assignment: WebAPI-HW5
- Class: CSCI 3916

Description: Mongoose schema and model for the Movie collection.
Includes imageUrl field added for HW5.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: true },
    releaseDate: {
        type: Number,
        min: [1900, 'Must be greater than 1899'],
        max: [2100, 'Must be less than 2100']
    },
    genre: {
        type: String,
        enum: [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
            'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
        ],
    },
    actors: [{
        actorName: String,
        characterName: String,
    }],
    imageUrl: { type: String },
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);