const { response } = require('express');
var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')

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
