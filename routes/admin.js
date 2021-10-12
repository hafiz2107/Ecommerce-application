const { response } = require('express');
var express = require('express');
var router = express.Router();
var date = new Date().toISOString().slice(0, 10);
var adminHelper = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');

const admin = {
  name : "admin",
  pass : "123"
}

// Getting Login page
router.get('/login',(req,res)=>{
  if(req.session.adminLoggedIn){
      res.redirect('/admin/home')
  }else
  error = req.session.adminLoggedInError
  res.render('admin/admin-login',{typeOfPersonAdmin : true,error});
  error = false;
  req.session.adminLoggedInError = false;
})

// Postinig and checking the login data 
router.post('/',(req,res)=>{
  if(req.body.username == admin.name && req.body.pwd == admin.pass){
    req.session.adminLoggedIn = true;
    res.redirect('/admin/home')
  }else{
    req.session.adminLoggedInError = true;
    res.redirect('/admin/login')
  }
})
/* GET users listing. */
router.get('/home', function(req, res, next) {
  if(req.session.adminLoggedIn){
    date = new Date().toISOString().slice(0, 10);
    res.render('admin/admin-home', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, date })
  }else{
    res.redirect('/admin/login')
  }
  
});

// Getting add product page
router.get('/add-product',(req,res)=>{
  if (req.session.adminLoggedIn) {
  date = new Date().toISOString().slice(0, 10);
  // rendering add product page 
  res.render('admin/admin-addproduct', { title: 'Add Product', typeOfPersonAdmin: true, date, adminHeader: true, adminNav: true})
  }else{
    res.redirect('/admin/login')
  }
})

// Posting add product form to database
router.post('/add-product',(req,res)=>{
// Calling function for uploading add product form
  adminHelper.addProduct(req.body).then((id)=>{

    let image1 = req.files.productimage1
    let image2 = req.files.productimage2
    let image3 = req.files.productimage3
    image1.mv('./public/uploads/'+id+'__1.jpg')
    image2.mv('./public/uploads/'+id+'__2.jpg')
    image3.mv('./public/uploads/'+id+'__3.jpg')
    
    // redirecting to admin add product after completing the upload
    res.redirect('/admin/add-product');
  })
})


router.get('/view-product',(req,res)=>{
  adminHelper.getAllproducts().then((products)=>{
    res.render('admin/admin-productview', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, products })
  })
})

// Delete Product
router.get('/remove-product/:id', (req, res) => {
  var productId = req.params.id
  adminHelper.deleteproduct(productId).then((result) => {
    res.redirect('/admin/view-product')
  })
})

// Getting edit product
  router.get('/edit-product/:id',async(req,res)=>{
    let productDetails = await adminHelper. getProductToEdit(req.params.id)
      res.render('admin/admin-editproduct', { productDetails,typeOfPersonAdmin: true, adminHeader: true, adminNav: true })
  })
// TO get the product to edit when clicked on the on the edit button 
router.post('/edit-product/:id',async(req,res)=>{
  // var proId = req.params.id
   adminHelper.updateProduct(req.params.id,req.body).then(()=>{
     res.redirect('/admin/view-product')
     if (req.files.productimage1 || req.files.productimage2 || req.files.productimage3){
       let image1 = req.files.productimage1
       let image2 = req.files.productimage2
       let image3 = req.files.productimage3
       image1.mv('./public/uploads/' + req.params.id + '__1.jpg')
       image2.mv('./public/uploads/' + req.params.id + '__2.jpg')
       image3.mv('./public/uploads/' + req.params.id + '__3.jpg')
     }
     
  })
})
// TO logout
router.get('/logout',(req,res)=>{
  req.session.adminLoggedIn = false;
  res.redirect('/admin/login')
})

router.get('/usermanagement',async(req,res)=>{
  let allUsers = await adminHelper.getAllUsers()
    res.render('admin/admin-usermanagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allUsers})
  })

router.get('/blockuser/:id',(req,res)=>{
  id = req.params.id
  adminHelper.blockUser(id).then((response)=>{
    if(response){
      res.redirect('/admin/usermanagement')
    }
  })
})

router.get('/unblockuser/:id',(req,res)=>{
  
  id = req.params.id
  
  adminHelper.unBlockUser(id).then((response) => {
    if (response) {
      res.redirect('/admin/usermanagement')
    }
  })
})

router.get('/ordermanagement',(req,res)=>{

  adminHelper.getAllOrders().then((orders)=>{
    res.render('admin/admin-ordermanagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true,orders})
  })
})

router.post('/updateorderstatus',(req,res)=>{
  adminHelper.updateOrderStatus(req.body.orderId,req.body.userId,req.body.status).then((response)=>{
    console.log('@update status Response : ',response);
    res.json(response)
  })
})

router.get('/viewoderlist/:orderId/:userId',(req,res)=>{
  console.log("THe order adn user ID : ",req.params.orderId,req.params.userId)
  adminHelper.getUserCartOrders(req.params.orderId,req.params.userId).then((cartOrders)=>{
    
    res.render('admin/admin-veiwcartorders', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, cartOrders})
  })
})
module.exports = router;  
