var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphbs  = require('express-handlebars')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var db= require('./config/connection');
var session = require('express-session');
var fileUpload = require('express-fileupload');  
const collection = require('./config/collection');
var helper = require('handlebars-helpers')();


// Creating an helper for HBS
var hbs = exphbs.create({
  extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/',
  // Custom HBS helpers
  helpers : helper
})

// handlebars.registerHelper("lt", (value)=>{
//   if(value>0){
//     console.log("THe value is : ",value);
//     return new Handlebars.SafeString('<span>Available</span>');
//   }else{
//     return new Handlebars.SafeString('<span>Sold out</span>');
//   }
// })


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine)

app.use(fileUpload())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:"Secret",
  cookie:{
    maxAge : 86400000,
  },
  resave : false,
  saveUninitialized : false,
}))

db.connect((err)=>{
  if(err){
    console.error("Something went wrong with database :",err );
  }else{
  console.log("Database Connected Successfully");
  }
}) 

app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  console.log("There is some error : ", res.locals.message)
});

module.exports = app;
