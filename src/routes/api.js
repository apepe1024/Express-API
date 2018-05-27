'use strict';

/**
 * GET    200 /api/courses
 * POST   201 /api/courses
 * GET    200 /api/courses/:id
 * PUT    204 /api/courses/:id
 * GET    200 /api/users
 * POST   201 /api/users
 * POST   201 /api/courses/:courseId/reviews
 * DELETE 204 /api/courses/:courseId/reviews/:id
 */

var express = require('express');
var router  = express.Router();
var mid     = require('../middleware');

var Course  = require('../models/course');
var Review  = require('../models/review');
var User    = require('../models/user');




/**
 * GET /api/courses
 * 200
 * Returns course "_id" and "title" properties of all available courses
 * { data: { _id, title } }
 */
router.get('/courses', function(req, res, next) {
    Course
        .find()
        .select('_id, title')
        .exec(function (err, courses) {
            if (err) return next(err);
            res.status(200);
            res.json({ data: courses });
        });
});




/**
 * POST /api/courses
 * 201
 * Creates a course, sets the Location header, and returns no content
 */
router.post('/courses', mid.requireAuth, function(req, res, next) {
    
    // Make a new course object
    let course = new Course(req.body);

    // Attempt to save the new course
    course.save(function (err) {
        if (err) {
            if (err.name === 'ValidationError') {
                // Handle validation errors
                res.status(400);
                res.json(validationErrors(400, err.errors));
            } else {
                return next(err);
            }
        } else {
            // Set headers and send the response
            res.status(201).location('/').send();
        }
    });
});




/**
 * GET /api/course/:id
 * 200
 * Returns all Course properties and related documents for the provided course ID
 * { data: [ courseObject ] }
 */
router.get('/courses/:id', function(req, res, next) {
    Course
        .findById(req.params.id)
        .populate({
            path: 'user',
            model: 'User'
        })
        .populate({
            path: 'reviews',
            model: 'Review',
            populate: {
                path: 'user',
                model: 'User'
            }
        })
        .exec(function (err, course) {
            if (err || !course) return next(err);
            res.status(200);
            res.json({ data: [course.toJSON({ virtuals: true })] });
        });
});




/**
 * PUT /api/courses/:id
 * 204
 * Updates a course and returns no content
 */
router.put('/courses/:id', mid.requireAuth, function(req, res, next) {
    
    // Check if the logged in user is the author
    if (req.body.user
        && req.body.user._id
        && req.body.user._id == req.userId) {

        // Make a new course object
        let course = new Course(req.body);

        // Attempt to save the new course
        Course.update({ _id: course._id }, course, function (err) {
            if (err) {
                if (err.name === 'ValidationError') {
                    // Handle validation errors
                    res.status(400);
                    res.json(validationErrors(400, err.errors));
                } else {
                    return next(err);
                }
            } else {
                // Set headers and send the response
                res.status(204).send();
            }
        });
    } else {
        // Only authors can edit their own courses
        let err = new Error('Courses can only be edited by their authors');
        err.status = 401;
        return next(err);
    }
});




/**
 * GET /api/users
 * 200
 * Returns the currently authenticated user
 * { fullName, emailAddress }
 */
router.get('/users', mid.requireAuth, function(req, res, next) {

    User.findOne({ _id: req.userId })
        .select('-hashedPassword')
        .exec(function (err, user) {
            if (err) return next(err);
            res.status(200).json({ data: [user] });
        });    
});




/**
 * POST /api/users
 * 201
 * Creates a user, sets the Location header to "/", and returns no content
 */
router.post('/users', function(req, res, next) {

    // Check for password match
    let password = '';
    if (req.body
        && req.body.password
        && req.body.confirmPassword
        && req.body.password === req.body.confirmPassword) {
            password = req.body.password;
    }

    // Make a new user object
    let user = new User({
        fullName: req.body.fullName,
        emailAddress: req.body.emailAddress,
        hashedPassword: password
    });

    // Attempt to save the new user
    user.save(function (err) {
        if (err) {
            if (err.name === 'ValidationError') {
                // Handle validation errors
                res.status(400);
                res.json(validationErrors(400, err.errors));
            } else {
                return next(err);
            }
        } else {
            // Set headers and send the response
            res.status(201).location('/').send();
        }
    });
});




/**
 * POST /api/courses/:courseId/reviews
 * 201
 * Creates a review for the specified course ID, sets the Location header
 * to the related course, and returns no content
 */
router.post('/courses/:courseId/reviews', mid.requireAuth, function(req, res, next) {

    // Prevent the author from reviewing own course
    Course
        .findById(req.params.courseId)
        .populate({
            path: 'reviews',
            model: 'Review'
        })
        .exec(function (err, course) {
            if (err) return next(err);
            if (course.user.equals(req.userId)) {
                let err = new Error('Can not review own course.');
                err.status = 400;
                return next(err);
            }

            // Prevent multiple reviews by the same user
            for (let i = 0; i < course.reviews.length; i++) {
                console.log(course.reviews[i].user);
                if (req.userId.equals(course.reviews[i].user)) {
                    let err = new Error('Can only review each course once.');
                    err.status = 400;
                    return next(err);
                }
            }

            // Otherwise proceed with adding the review
            // Make a new review object and add the user ID
            req.body.user = req.userId;
            let review = new Review(req.body);

            // Save the review
            review.save(function (err) {
                
                // Handle any errors
                if (err) {
                    if (err.name === 'ValidationError') {
                        // Handle validation errors
                        res.status(400);
                        res.json(validationErrors(400, err.errors));
                    } else {
                        // Any other erors
                        return next(err);
                    }

                // Get the course from database and link review
                } else {
                    Course.findOne({ _id: req.params.courseId }, function (err, course) {
                        if (err) return next(err);
                        
                        // Link review to course and save
                        course.reviews.push(review._id);
                        course.save(function (err, updated) {
                            if (err) return next(err);                    
                            // Set headers to redirect to article location
                            res.status(201).location('/courses/' + updated._id).send();
                        });
                    });
                }
            });

        });
});




/** 
 * DELETE /api/courses/:courseId/reviews/:id
 * 204
 * Deletes the specified review and returns no content
 */
router.delete('/courses/:courseId/reviews/:id', mid.requireAuth, function(req, res, next) {
    
    // Find the course in the database
    Course
        .findById(req.params.courseId)
        .exec(function (err, course) {
            if (err) return next(err);

            // Find the review in the database
            Review
                .findById(req.params.id)
                .exec(function (err, review) {
                    if (err) return next(err);

                    // If is the author of either the course or the review
                    if (req.userId.equals(course.user) || req.userId.equals(review.user)) {

                        // Remove review from course
                        course.reviews.pull(req.params.id);
                        course.save(function (err, updated){
                            if (err) return next(err);

                            // Remove review from database
                            Review
                                .remove({ _id: req.params.id })
                                .exec(function (err) {
                                    if (err) return next(err);

                                    // Send 204 status and terminate response
                                    res.status(204).send();
                                });
                        });

                    // Is not authorised to delete
                    } else {
                        let err = new Error('Reviews can only be deleted by their authors or course authors.');
                        err.status = 401;
                        return next(err);
                    }
                });            
        });
});


/**
 * Routes not implemented
 */

// /api/courses
// PUT    403 - Cannot edit a collection of courses.
// DELETE 403 - Cannot delete a collection of courses.

router.put('/courses', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot edit a collection of courses.'
    });
});

router.delete('/courses', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot delete a collection of courses.'
    });
});


// /api/courses/:id
// POST   405 - Use the '/api/courses' route to create a course.
// DELETE 403 - Cannot delete a course.

router.post('/courses/:id', function (req, res, next) {
    res.set('Allow', 'GET, PUT');
    return res.status(405).json({
        error: 'Use the `/api/courses` route to create a course.'
    });
});

router.delete('/courses/:id', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot delete a course.'
    });
});


// /api/users
// PUT    403 - Cannot edit a collection of users.
// DELETE 403 - Cannot delete a collection of users.

router.put('/users', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot edit a collection of users.'
    });
});

router.delete('/users', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot delete a collection of users.'
    });
});


// /api/courses/:courseId/reviews
// PUT    403 - Cannot edit a collection of reviews.
// DELETE 403 - Cannot delete a collection of reviews.

router.put('/courses/:courseId/reviews', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot edit a collection of reviews.'
    });
});

router.delete('/courses/:courseId/reviews', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot delete  a collection of reviews.'
    });
});


// /api/courses/:courseId/reviews/:id
// GET  403 - Cannot get a single review.
//            Use the '/api/courses/:id' route instead to get the
//            reviews for a specific course.
// POST 405 - Use the '/api/courses/:courseId/reviews' route to create a review.
// PUT  403 - Cannot edit a review.

router.get('/courses/:courseId/reviews/:id', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot get a single review. Use the `/api/courses/:id` route instead to get the reviews for a specific course.'
    });
});

router.post('/courses/:courseid/reviews/:id', function (req, res, next) {
    res.set('Allow', 'DELETE');
    return res.status(405).json({
        error: 'Use the `/api/courses/:courseId/reviews` route to create a review.'
    });
});

router.put('/courses/:courseid/reviews/:id', function (req, res, next) {
    return res.status(403).json({
        error: 'Cannot edit a review.'
    });
});




/**
 * Helper function for format validation messages
 * 
 * @param {Number} code Error code for API to return
 * @param {Error} errors Error messages returned by the validator
 */
function validationErrors(code, errors) {
    
    let errMessages = [];

    for (let err in errors) {
        if (errors[err] && errors[err].message) {
            errMessages.push({
                code: code,
                message: errors[err].message
            });
        }
    }

    return {
        message: 'Validation Failed',
        errors: {
            property: errMessages
        }
    };
}




module.exports = router;