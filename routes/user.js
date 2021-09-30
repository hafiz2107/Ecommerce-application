const { response } = require('express');
var express = require('express');
const otpkeys = require('../config/otpkeys.js');

var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
const keys = require('../config/otpkeys');
const { parse } = require('dotenv');
const client = require('twilio')(keys.accountsid, keys.authtoken);

var mobile ;
/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.LoggedIn){
    console.log("1.Home page loaded");
    var currentUser = req.session.user
    userHelpers.getAllProducts().then((products) => {
      console.log("inside : get all products");
      res.render('user/user-home', { title: 'Home', user: true, currentUser, typeOfPersonUser: true, products});
    })
    
  }else{
    console.log("1.Home page loaded");
    var currentUser = req.session.user
    userHelpers.getAllProducts().then((products) => {
      console.log("inside : get all products");
      res.render('user/user-home', { title: 'Home', user: true, currentUser: false, typeOfPersonUser: true,products });
    })
    
  }

});

// Getting login page
router.get('/login',(req,res)=>{
  if(req.session.LoggedIn){
    res.redirect('/')
  }
  else{
    console.log("1.1 Login Page loaded");
    loggedInErr = req.session.loggedInErr
    emailError = req.session.emailError;
    passError = req.session.passError;
    
    res.render('user/user-login', { title: 'Login', loginAndSignup: true, loggedInErr, typeOfPersonUser: true , emailError, passError})
    emailError = false
    req.session.emailError = false;
    passError = false
    req.session.passError = false;
    loggedInErr = false;
    req.session.loggedInErr = false
  }

})

// Posting Logged in user's data
router.post('/login',(req,res)=>{
  console.log("1.2 Posting logged in users data");
  userHelpers.doLogin(req.body).then((response)=>{
    
    if(response.status){
      req.session.user = req.body;
      var userSession = req.session.user;
      req.session.LoggedIn = true
      res.redirect('/')
    }else if(response.passError){
      req.session.loggedInErr = true
      req.session.passError = response.passError

      console.log("At else in the login post");
      res.redirect('/login');
    }else if(response.emailError){
      req.session.loggedInErr = true
      req.session.emailError = response.emailError

      console.log("At else in the login post");
      res.redirect('/login');
    }
  })
})
 
// Gettting sign up page
router.get('/signup',(req,res)=>{
  if(req.session.LoggedIn){
    res.redirect('/')
  }
  else{
    userNameAlreadyExist = req.session.userNameAlreadyExist
    console.log("1.2 Getting signup page");
    res.render('user/user-signup', { title: 'Signup', loginAndSignup: true, userNameAlreadyExist, typeOfPersonUser: true})
    userNameAlreadyExist = false;
    req.session.userNameAlreadyExist = false;
  }

})

// posting Signed up data
router.post('/signup',(req,res)=>{
  console.log("1.3 Posting Signedup user data");
  console.log(req.body);
  userHelpers.userSignup(req.body).then((response)=>{
    console.log("the response is : ",response);
    if(response){
      res.redirect('/login')
    }else{
      req.session.userNameAlreadyExist = true;
      res.redirect('/signup')
    }

  })

})

// Getting Forgot password PAge
router.get('/forgotpassword',(req,res)=>{
  console.log(req.body)
  res.render('user/user-forgotpassword', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true })
})

// Posting Forgot password PAge
router.post('/forgotpassword',(req,res)=>{
  mobileError = false
  mobile = parseInt(''+req.body.countryCode + req.body.mobileno)
  
  console.log("The mobile no. is : ",mobile);
  userHelpers.checkMobNo(req.body).then((response)=>{
    if(response){
      // If response is true sending the OTP Message
      client.verify.services(keys.serviceid)
        .verifications
        .create({ to: '+'+mobile, channel: 'sms' }).then((data)=>{
        console.log("THe data after sending message : ",data)
          res.render('user/user-otp', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true , mobile})
      }).catch((err)=>{
        console.log("The error in sending message : ",err);
      })
    }else{
      mobileError = true
      res.render('user/user-forgotpassword',{ title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true ,mobileError})
      mobileError = false
    }
  })
})

// Getting Otp Entering page



// Posting The verified OTP adn redirecting to home page
router.post('/otpverify',(req,res)=>{
  client.verify
    .services(keys.serviceid)
    .verificationChecks.create({ to: '+'+req.body.phone, code: req.body.otp })
    .then((verification_check) => {
      if (verification_check.status  == 'approved') {
        res.redirect('/')
      }else{
        mobile = req.body.phone
        otpError = true
        res.render('user/user-otp', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true, mobile ,otpError})
        otpError = false
      }
    }).catch((err)=>{
      console.log(err);
    })
})

// Getting product single view page
router.get('/productview/:id', (req, res) => {
  console.log("Product single view page loaded");
  var proId = req.params.id
  userHelpers.singleProduct(proId).then(([singleProduct , relatedProduct])=>{
    res.render('user/user-singleproduct', { title: 'Product', user: true, typeOfPersonUser: true, singleProduct, relatedProduct})
  })
})

// Logout
router.get('/logout',(req,res)=>{
  console.log("Loggin out");
  req.session.LoggedIn = false
  req.session.loggedInErr = false
  res.redirect('/');
})

module.exports = router;
