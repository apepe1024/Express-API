'use strict';

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

mongoose.Promise = global.Promise;



var courseSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'A course must have a title.']
    },
    description: {
        type: String,
        required: [true, 'A course must have a description.']
    },
    estimatedTime: {
        type: String
    },
    materialsNeeded: {
        type: String
    },
    steps: [{
        stepNumber: Number,
        title: {
            type: String,
            required: [true, 'Each step must have a title.']
        },
        description: {
            type: String,
            required: [true, 'Each step must have a description.']
        }
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, { usePushEach: true });



// set the 'stepNumber' property to correct number
courseSchema
    .pre('save', function(next) {
        this.steps = this.steps.map(function (step, index) {
            step.stepNumber = index + 1;
            return step;
        });
        return next();
    });


// step validation, must have at least one step
courseSchema
    .path('steps')
    .validate(function (steps) {
        return steps.length >= 1;
    }, 'Each course must have at least one step.');



// overallRating virtual field
courseSchema
    .virtual('overallRating').get(function (){
        let numReviews = this.reviews.length;
        let totalScore = 0;
        this.reviews.forEach(function (review) {
            totalScore += review.rating;
        });
        return Math.round(totalScore / numReviews);
    });




var Course = mongoose.model('Course', courseSchema);
module.exports = Course;
