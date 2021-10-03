const { response } = require('express');
var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
const keys = require('../config/otpkeys');
const { parse } = require('dotenv');
const client = require('twilio')(keys.accountsid, keys.authtoken);

var userToresetPass
var currentUser

/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.session.LoggedIn) {
    console.log("1.Home page loaded at if");

    currentUser = req.session.user
    logStatus = req.session.LoggedIn
    userId = req.session.userDetails
    // Calling function to get the cart count
    let cartCount = await userHelpers.getCartCount(req.session.userDetails)


    userHelpers.getAllProducts().then((products) => {
      console.log("inside : get all products");
      res.render('user/user-home', { title: 'Home', user: true, currentUser, typeOfPersonUser: true, products, logStatus, cartCount });
    })

  } else if (req.session.LoggedInThruOtp) {
    console.log("1.Home page loaded at else if");
    req.session.LoggedIn = true
    userHelpers.getAllProducts().then((products) => {
      console.log("inside : get all products");
      currentUser = req.session.resetUser

      res.render('user/user-home', { title: 'Home', user: true, currentUser, typeOfPersonUser: true, products });
    })
  }
  else {
    console.log("1.1Home page loaded at else");
    var currentUser = req.session.user
    userHelpers.getAllProducts().then((products) => {
      console.log("inside : get all products");
      res.render('user/user-home', { title: 'Home', user: true, currentUser: false, typeOfPersonUser: true, products });
    })

  }

});

// Getting login page
router.get('/login', (req, res) => {
  if (req.session.LoggedIn) {
    res.redirect('/')
  }
  else {
    console.log("1.1 Login Page loaded");
    loggedInErr = req.session.loggedInErr
    emailError = req.session.emailError;
    passError = req.session.passError;

    res.render('user/user-login', { title: 'Login', loginAndSignup: true, loggedInErr, typeOfPersonUser: true, emailError, passError })
    emailError = false
    req.session.emailError = false;
    passError = false
    req.session.passError = false;
    loggedInErr = false;
    req.session.loggedInErr = false
  }

})

// Posting Logged in user's data
router.post('/login', (req, res) => {
  console.log("1.2 Posting logged in users data");
  userHelpers.doLogin(req.body).then((response) => {

    if (response.status) {

      req.session.userDetails = response.user._id;
      req.session.user = req.body;
      var userSession = req.session.user;
      req.session.LoggedIn = true
      res.redirect('/')
    } else if (response.passError) {
      req.session.loggedInErr = true
      req.session.passError = response.passError
      console.log("At else in the login post");
      res.redirect('/login');
    } else if (response.emailError) {
      req.session.loggedInErr = true
      req.session.emailError = response.emailError

      console.log("At else in the login post");
      res.redirect('/login');
    }
  })
})

// Gettting sign up page
router.get('/signup', (req, res) => {
  if (req.session.LoggedIn) {
    res.redirect('/')
  }
  else {
    userNameAlreadyExist = req.session.userNameAlreadyExist
    console.log("1.2 Getting signup page");
    res.render('user/user-signup', { title: 'Signup', loginAndSignup: true, userNameAlreadyExist, typeOfPersonUser: true })
    userNameAlreadyExist = false;
    req.session.userNameAlreadyExist = false;
  }

})

// posting Signed up data
router.post('/signup', (req, res) => {
  console.log("1.3 Posting Signedup user data");
  console.log(req.body);
  userHelpers.userSignup(req.body).then((response) => {
    console.log("the response is : ", response);
    if (response) {
      res.redirect('/login')
    } else {
      req.session.userNameAlreadyExist = true;
      res.redirect('/signup')
    }

  })

})

// Getting Forgot password PAge
router.get('/forgotpassword', (req, res) => {
  console.log(req.body)
  res.render('user/user-forgotpassword', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true })
})

// Posting Forgot password PAge and checking the user exist or not 
router.post('/forgotpassword', (req, res) => {
  mobileError = false
  mobile = parseInt('' + req.body.countryCode + req.body.mobileno)

  userHelpers.checkMobNo(req.body).then((user) => {
    userToresetPass = user;
    if (user) {
      // If response is true sending the OTP Message
      client.verify.services(keys.serviceid)
        .verifications
        .create({ to: '+' + mobile, channel: 'sms' }).then((data) => {
          // Data will  be recieved with The send status adn all
          res.render('user/user-otp', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true, mobile })

        }).catch((err) => {
          // If there is any error THe actch block will catch it
          res.redirect('/404')
          console.log("The error in sending message : ", err);
        })
    } else {
      // Mobile number entered is wrong
      mobileError = true
      res.render('user/user-forgotpassword', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true, mobileError })
      mobileError = false
    }
  })
})


// Posting The verified OTP adn redirecting to home page
router.post('/otpverify', (req, res) => {
  var user = req.body
  // userHelpers.checkMobNo(req.body)
  // Checking whether the Entered OTP Is wrong
  client.verify
    .services(keys.serviceid)
    .verificationChecks.create({ to: '+' + req.body.phone, code: req.body.otp })
    .then((verification_check) => {
      // If the OTP is wright It will give status as Approved else it will give status as Pending
      if (verification_check.status == 'approved') {
        console.log("RESET : ", userToresetPass)
        res.render('user/user-resetpassword', { title: 'Verify OTP', loginAndSignup: true, typeOfPersonUser: true })
      } else {
        mobile = req.body.phone
        otpError = true
        res.render('user/user-otp', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true, mobile, otpError })
        otpError = false
      }
    }).catch((err) => {
      console.log(err);
    })
})

// Posting reseting password that user entered
router.post('/resetpassword', (req, res) => {
  console.log("user ro : ", userToresetPass);
  console.log("Patch : ", req.body);

  userHelpers.updatePassword(req.body, userToresetPass).then((result) => {
    if (result) {
      currentUser = userToresetPass
      resetSuccess = true
      req.session.LoggedIn = false
      req.session.LoggedInThruOtp = true
      req.session.resetUser = currentUser
      res.redirect('/')

    } else {
      newPassError = true
      res.render('user/user-user-resetpassword', { title: 'Reset password', loginAndSignup: true, typeOfPersonUser: true, newPassError })
      newPassError = false
    }
  })
})

// Getting product single view page
router.get('/productview/:id', (req, res) => {
  console.log("Product single view page loaded");
  var proId = req.params.id
  userHelpers.singleProduct(proId).then(([singleProduct, relatedProduct]) => {
    res.render('user/user-singleproduct', { title: 'Product', user: true, typeOfPersonUser: true, singleProduct, relatedProduct })
  })
})

// Gettign the cart page
router.get('/cart', async (req, res) => {
  user = req.session.userDetails
  logStatus = req.session.LoggedIn
  currentUser = req.session.user

  if (req.session.LoggedIn) {
    let products = await userHelpers.getCartProducts(req.session.userDetails)
    if (products) {
      res.render('user/user-cart', { title: 'Product', products, user: true, typeOfPersonUser: true, currentUser })
    }
    else {
      res.render('user/user-cart', { title: 'Product', currentUser, user: true, typeOfPersonUser: true, logStatus })
    }

  } else {
    res.redirect('/login')
  }



})

// Adding items to the cart
router.get('/add-to-cart/:id', (req, res) => {
  console.log("apoi call")
  user = req.session.userDetails
  // console.log("IDDD : ",user);
  userHelpers.addToCart(req.params.id, req.session.userDetails).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', (req, res) => {
  console.log("SAISoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo : ", req.body)
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})

// Logout
router.get('/logout', (req, res) => {
  console.log("Loggin out");
  req.session.LoggedIn = false
  req.session.LoggedInThruOtp = false
  req.session.loggedInErr = false
  res.redirect('/');
})


router.get('/404', (req, res) => {
  res.render('404', { title: 'Error 404', loginAndSignup: true, typeOfPersonUser: true })
})
module.exports = router;