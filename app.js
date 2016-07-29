var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index.js');
var users = require('./routes/users.js');

var app = express();

// uncomment after placing favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Requests logger
app.use(logger('dev'));

// Data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Serving public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);
app.use('/users', users);


module.exports = app;
