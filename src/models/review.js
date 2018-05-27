'use strict';

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

mongoose.Promise = global.Promise;



var reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    postedOn: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        required: [true, 'Review must have a rating value.']
    },
    review: {
        type: String
    }
}, { usePushEach: true });



// Review is always a whole number
reviewSchema
    .pre('save', function (next) {
        Math.round(this.rating);
        return next();
    });



// Validate rating must be between 1 and 5
reviewSchema
    .path('rating')
    .validate(function (rating) {
        return (rating >= 1 && rating <= 5);
    }, 'Rating must be a number between 1 and 5.');




var Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
