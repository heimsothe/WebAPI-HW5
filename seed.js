/*
- File: seed.js
- Author: Elijah Heimsoth
- Date: 04/15/2026
- Assignment: WebAPI-HW5
- Class: CSCI 3916

Description: One-shot script to populate imageUrl on existing movie
documents in MongoDB Atlas. Run with: node seed.js
Reads DB connection string from process.env.DB. Idempotent.
 */

require('dotenv').config();
var mongoose = require('mongoose');
var Movie = require('./Movies');

// Poster images from TMDB (The Movie Database) CDN
var IMAGE_MAP = {
    'The Martian': 'https://image.tmdb.org/t/p/w500/fASz8A0yFE3QB6LgGoOfwvFSseV.jpg',
    'Ford v Ferrari': 'https://image.tmdb.org/t/p/w500/dR1Ju50iudrOh3YgfwkAU1g2HZe.jpg',
    'Happy Gilmore': 'https://image.tmdb.org/t/p/w500/4RnCeRzvI1xk5tuNWjpDKzSnJDk.jpg',
    'The Dark Knight': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    'Step Brothers': 'https://image.tmdb.org/t/p/w500/nvggBbEraUTAVR6ffP3AaBUWSHs.jpg',
};

async function main() {
    await mongoose.connect(process.env.DB);
    console.log('Connected to Atlas. Seeding imageUrl...');

    for (var title of Object.keys(IMAGE_MAP)) {
        var url = IMAGE_MAP[title];
        var res = await Movie.updateOne({ title: title }, { $set: { imageUrl: url } });
        console.log(title + ': matched=' + res.n + ', modified=' + res.nModified);
    }

    console.log('Done.');
    await mongoose.disconnect();
}

main().catch(function(err) { console.error(err); process.exit(1); });
