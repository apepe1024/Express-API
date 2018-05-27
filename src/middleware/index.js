'use strict';

var auth       = require('basic-auth');
var bcrypt     = require('bcrypt');
var User       = require('../models/user');




/**
 * Middleware function for checking authorization headers against the
 * database. On success, sets the `userId` to the request body.
 * On failure, throws `401 Unauthorized` error message.
 */
const requireAuth = function (req, res, next) {
  
    // define unauthorised error message
    let unauthorized = new Error('Unauthorized');
    unauthorized.status = (401);

    // check for authorization headers
    let credentials = auth(req);
    if (credentials && credentials.name && credentials.pass) {
    
    // attepmpt to grab the user account from database
    User.findOne({ emailAddress: credentials.name })
        .exec(function (err, user) {
            if (err || !user) return next(unauthorized);
          
            // if found, check for a password match
            bcrypt.compare(credentials.pass, user.hashedPassword, function (err, check) {
            
                if (check) { // Attach the user id to the request and continue
                    req.userId = user._id;
                    return next();
                }

                return next(unauthorized);
            });
        });

    // no credentials in the authorization header
    } else {
        return next(unauthorized);
    }
}




module.exports.requireAuth = requireAuth;