'use strict';

var express    = require('express');
var morgan     = require('morgan');
var apiRouter  = require('./routes/api');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

var app = express();

var Course  = require('./models/course');
var Review  = require('./models/review');
var User    = require('./models/user');




/**
 * Application setup
 */

// set our port
app.set('port', process.env.PORT || 5000);

// morgan gives us http request logging
app.use(morgan('dev'));

// parse the incomming request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));

// mongoose to use standard promises
mongoose.Promise = global.Promise;




/**
 * Database connection
 */

mongoose
    .connect('mongodb://localhost:27017/course-rating-api')
    .catch(function (err) {
        console.log('MongoDB: connection error');
    });
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('MongoDB: ' + err.message);
});

db.on('connected', function() {
    console.log('MongoDB: successfully connected');
});

db.on('disconnected', function() {
    console.log('MongoDB: disconnected');
});




/**
 * Seeding sample data
 */

var seeder     = require('mongoose-seeder');
var seedData   = require('./data/data.json');

db.once('open', function () {
  seeder
    .seed(seedData)
    .catch(function (err) {
      console.log(err);
    });
});




/**
 * Routes
 */

app.use('/api', apiRouter);




/**
 * Error handling
 */

// catch 404 errors and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Document not found');
    err.status = 404;
    return next(err);
});

// global error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error: err.message || 'Something went wrong' });
});




/**
 * Start the application server
 */

var server = app.listen(app.get('port'), function () {
    console.log('Express: server listening on port ' + server.address().port);  
});