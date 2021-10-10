const { response } = require('express');
var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
const keys = require('../config/otpkeys');
const { parse } = require('dotenv');
const client = require('twilio')(keys.accountsid, keys.authtoken);

var userToresetPass
var currentUser
let cartCount
let cartProductsTodisplay
let totalValue

/* GET home page. */
router.get('/', async function (req, res, next) {

  if (req.session.LoggedIn && req.session.unblock) {
    
    currentUser = req.session.user
    logStatus = req.session.LoggedIn
    userId = req.session.userDetails
    // Calling function to get the cart count
    cartCount = await userHelpers.getCartCount(req.session.userDetails)
    cartProductsTodisplay = await userHelpers.getCartProducts(req.session.userDetails)
    // Getting Cart products to display in modal of cart 
    let Cartproducts = await userHelpers.getCartProducts(req.session.userDetails)
    userHelpers.getAllProducts().then((products) => {
      res.render('user/user-home', { title: 'Home', user: true, Cartproducts, currentUser, typeOfPersonUser: true, products, logStatus, cartCount,items: cartProductsTodisplay});
    })

  } else if (req.session.LoggedInThruOtp) {
  
    req.session.LoggedIn = true
    userHelpers.getAllProducts().then((products) => {
      
      currentUser = req.session.resetUser

      res.render('user/user-home', { title: 'Home', user: true, currentUser, typeOfPersonUser: true, products, cartCount });
    })
  } 
  else {
    
    
    var currentUser = req.session.user
    userHelpers.getAllProducts().then((products) => {
      
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
    loggedInErr = req.session.loggedInErr
    emailError = req.session.emailError;
    passError = req.session.passError;
   
    res.render('user/user-login', { title: 'Login', loginAndSignup: true, loggedInErr, typeOfPersonUser: true, emailError, passError ,block:req.session.block})
    req.session.block = false
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
  userHelpers.doLogin(req.body).then((response) => {
    
    if(response.user.block == 'false'){
      response.user.block = false;
    }else{
      response.user.block = true;
    }
    
    req.session.block = response.user.block

    if(req.session.block){
      res.redirect('/login')
    }
   else if (response.status) {
      req.session.unblock = true
      req.session.block = response.user.block
      req.session.userDetails = response.user._id;
      req.session.user = req.body;
      var userSession = req.session.user;
      req.session.LoggedIn = true
        res.redirect('/')
    } else if (response.passError) {
      req.session.loggedInErr = true
      req.session.passError = response.passError
      res.redirect('/login');
    } else if (response.emailError) {
      req.session.loggedInErr = true
      req.session.emailError = response.emailError

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
    res.render('user/user-signup', { title: 'Signup', loginAndSignup: true, userNameAlreadyExist, typeOfPersonUser: true })
    userNameAlreadyExist = false;
    req.session.userNameAlreadyExist = false;
  }

})

// posting Signed up data
router.post('/signup', (req, res) => {
  userHelpers.userSignup(req.body).then((response) => {
    if (response) {
      var mobile = response.countryCode+response.mobile;
      mobile = parseInt(mobile);

      client.verify.services(keys.serviceid)
        .verifications
        .create({ to: '+' + mobile, channel: 'sms' }).then((data) => {
          // Data will  be recieved with The send status adn all
          res.render('user/user-mobileconfirmation', { title: 'Mobile Confirmation', loginAndSignup: true, typeOfPersonUser: true, mobile })

        }).catch((err) => {
          // If there is any error THe actch block will catch it
          res.redirect('/404')
        })
      

    } else {
      req.session.userNameAlreadyExist = true;
      res.redirect('/signup')
    }

  })

})

// Verifying the OTP send when entering the OTP
router.post('/mobileConfirmation',(req,res)=>{

  client.verify
    .services(keys.serviceid)
    .verificationChecks.create({ to: '+' + req.body.phone, code: req.body.otp })
    .then((verification_check) => {
      // If the OTP is wright It will give status as Approved else it will give status as Pending
      if (verification_check.status == 'approved') {
        res.redirect('/login')
      } else {
        mobile = req.body.phone
        otpError = true
        res.render('user/user-mobileconfirmation', { title: 'Mobile Confirmation', loginAndSignup: true, typeOfPersonUser: true, mobile, otpError })
        otpError = false
      }
    }).catch((err) => {
      res.redirect('/404')
    })
})

// Sign in using OTP
router.get('/signinotp',(req,res)=>{
  res.render('user/user-signinotp', { title: 'Signin Using OTP', loginAndSignup: true, typeOfPersonUser: true})
})
// Sign in using OTP
router.post('/signinotp',(req,res)=>{
  var mobile = req.body.countryCode + req.body.mobileno;
  mobile = parseInt(mobile);
  userHelpers.checkMobNo(req.body).then((user) => {
    userToresetPass = user;
    if (user) {
      // If response is true sending the OTP Message
      client.verify.services(keys.serviceid)
        .verifications
        .create({ to: '+' + mobile, channel: 'sms' }).then((data) => {
          // Data will  be recieved with The send status adn all
          res.render('user/user-signinconfirmation', { title: 'Enter OTP', loginAndSignup: true, typeOfPersonUser: true, mobile })

        }).catch((err) => {
          // If there is any error THe actch block will catch it
          res.redirect('/404')
        })
    } else {
      // Mobile number entered is wrong
      mobileError = true
      res.render('user/user-signinotp', { title: 'Forgot Password', loginAndSignup: true, typeOfPersonUser: true, mobileError })
      mobileError = false
    }
  })
})

// Post sign in using OTP
router.post('/signinconfirmation',(req,res)=>{
  client.verify
    .services(keys.serviceid)
    .verificationChecks.create({ to: '+' + req.body.phone, code: req.body.otp })
    .then((verification_check) => {
      
      if (verification_check.status == 'approved') {
        phoneNo = req.body.phone.slice(2)
        
        userHelpers.findUser(phoneNo).then((user)=>{
          if(user){
            req.session.unblock = true
            req.session.block = user.block
            req.session.userDetails = user._id;
            req.session.user = user
            var userSession = req.session.user;
            req.session.LoggedIn = true
            res.redirect('/')
          }else{
            userNotExist = true
            res.render('user-signinconfirmation', { title: 'OTP', loginAndSignup: true, typeOfPersonUser: true,userNotExist})
            userNotExist = false
          }
          
        })
        
      } else {
        mobile = req.body.phone
        otpError = true
        res.render('user/user-mobileconfirmation', { title: 'Mobile Confirmation', loginAndSignup: true, typeOfPersonUser: true, mobile, otpError })
        otpError = false
      }
    }).catch((err) => {
      res.redirect('/404')
      console.log(err);
    })
})


// Getting Forgot password PAge
router.get('/forgotpassword', (req, res) => {
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
router.get('/productview/:id',async (req, res) => {
  console.log("Product single view page loaded");
  var proId = req.params.id
  logStatus = req.session.LoggedIn
  let cartProductsTodisplay = await userHelpers.getCartProducts(req.session.userDetails)
  let cartCount = await userHelpers.getCartCount(req.session.userDetails)

  userHelpers.singleProduct(proId).then(([singleProduct, relatedProduct]) => {
    res.render('user/user-singleproduct', { title: 'Product', user: true, typeOfPersonUser: true, singleProduct, relatedProduct,cartCount, currentUser, logStatus,items: cartProductsTodisplay })
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
      totalValue = await userHelpers.getTotalAmount(req.session.userDetails)
      let UserId = req.session.userDetails
      res.render('user/user-cart', { title: 'Product', products, user: true, typeOfPersonUser: true, currentUser, userId, totalValue})
    }
    else {
      res.render('user/user-cart', { title: 'Product', currentUser, user: true, typeOfPersonUser: true, logStatus })
    }

  } else {
    res.redirect('/login')
  }



})

// Adding items to the cart
router.get('/add-to-cart/:id/:proPrice', (req, res) => {
  console.log("apoi call", req.params.proPrice)
  user = req.session.userDetails
  userHelpers.addToCart(req.params.id, req.session.userDetails, req.params.proPrice).then(() => {
    res.json({ status: true })
  })
})

// Change pproduct quantity when clicking + & -
router.post('/change-product-quantity', async(req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async(response) => {
    response.total = await userHelpers.getTotalAmount(req.session.userDetails)
        res.json(response)
  })
})

// Delete from cart
router.post('/delete-cart-product' , (req,res)=>{
  userHelpers.deleteProduct(req.body).then((response)=>{
    res.json(response)
  })
})

// Getting the checkout page
router.get('/checkout',async(req,res)=>{
  if(req.session.LoggedIn){
    let products = await userHelpers.getCartProducts(req.session.userDetails)
    let user = req.session.userDetails
    res.render('user/user-checkout', { title: 'Checkout', user: true, currentUser, typeOfPersonUser: true,  logStatus, products, totalValue,user})
  }else{
    res.redirect('/login')
  }
})

// Posting Checkout form
router.post('/checkout',async(req,res)=>{
  
  if (req.session.LoggedIn) {    
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.session.userDetails)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{

    console.log("req.body : ", req.body.payment_method);
    // Checking Whether the payement method is COD or online
    if (req.body.payment_method == 'COD'){
      res.json({codSuccess: true})
    }else{
      console.log("@ Payement method online");
      userHelpers.generateRazorpay(orderId, totalPrice).then((response)=>{
        console.log("@Post checkout resopnse : ", response);
        res.json(response)
      })  
    }
    
  })
}
else{
  res.redirect('/login')
} 
}) 

// Getting order confirmed page
router.get('/orderconfirmed' , (req,res)=>{
  if(req.session.LoggedIn){
    res.render('user/user-orderconfirmed', { title: 'Order Confirmed', currentUser, typeOfPersonUser: true , loginAndSignup:true})
  }else{
    res.redirect('/login')
  }
})

router.get('/vieworders',async(req,res)=>{
  if(req.session.LoggedIn){
      userHelpers.getUserOrders(req.session.userDetails).then(async(orders)=>{ 
        singleProducts = await userHelpers.getSingleOrderedProducts(orders[0]._id)
        var orders = orders[0]
        res.render('user/user-vieworders', { title: 'View Orders', user: true, currentUser,orders , typeOfPersonUser: true, logStatus, cartCount, singleProducts  })
    })
       
  }
})

router.post('/verify-payment',(req,res)=>{
  console.log("@Verify payement : ",req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment success ");
      res.json({status : true})
    })
  }).catch((err)=>{
    console.log("The error in payment  : ",err);
    res.json({status : false})
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

// The error page
router.get('/404', (req, res) => {
  res.render('404', { title: 'Error 404', loginAndSignup: true, typeOfPersonUser: true })
})
module.exports = router;