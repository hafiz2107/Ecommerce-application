const { response } = require('express');
var express = require('express');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var date = new Date().toISOString().slice(0, 10);
var adminHelper = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');
const { route } = require('./user');
var weather = require('weather-js');

const admin = {
  name: "admin",
  pass: "123"
}

var weatherDet

weather.find({ search: '673303', degreeType: 'C' }, function (err, result) {
  if (err) {
    weatherDet = null
    console.log(err);
  } else {
    weatherDet = result[0].current
  }
});

// Getting Login page
router.get('/login', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/home')
  } else
    error = req.session.adminLoggedInError
  res.render('admin/admin-login', { typeOfPersonAdmin: true, error, weatherDet });
  error = false;
  req.session.adminLoggedInError = false;
})

// Postinig and checking the login data 
router.post('/', (req, res) => {
  if (req.body.username == admin.name && req.body.pwd == admin.pass) {
    req.session.adminLoggedIn = true;
    res.redirect('/admin/home')
  } else {
    req.session.adminLoggedInError = true;
    res.redirect('/admin/login')
  }
})


/* GET users listing. */
router.get('/home', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    date = new Date().toISOString().slice(0, 10)
    adminHelper.findAllOrders().then(async (orderCount) => {
      var orders = []
      adminHelper.fetchDeliveredProductsOfTodayBuyNow().then(([delivered, placed, totalCancel, totalcod, activeUsers, totalProducts, itemsLowOnStock, productsOnOffer, stockOverProducts]) => {
        orders = [orderCount.allOrders, orderCount.allPendingOrders, orderCount.allPlacedOrders, orderCount.allShippedOrders, orderCount.allDeliveredOrders, orderCount.allCancelledOrders]
        res.render('admin/admin-home', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, date, weatherDet, orders, totalOrdersToday: orderCount.totalOrdersToday, delivered, placed, totalCancel, totalcod, activeUsers, totalProducts, itemsLowOnStock, productsOnOffer, stockOverProducts })
      })
    })


  } else {
    res.redirect('/admin/login')
  }

});

// Getting add product page
router.get('/add-product', (req, res) => {
  if (req.session.adminLoggedIn) {
    date = new Date().toISOString().slice(0, 10);
    adminHelper.fetchAllMainCategories().then((allCategories) => {
      adminHelper.findAllProductBrands().then((allProductBrands) => {
        adminHelper.getAllbikebrands().then((allBikeBrands) => {

          res.render('admin/admin-addproduct', { title: 'Add Product', typeOfPersonAdmin: true, date, adminHeader: true, adminNav: true, allCategories, allProductBrands, allBikeBrands, weatherDet })
        })
      })
    })

    // rendering add product page 
  } else {
    res.redirect('/admin/login')
  }
})

// Posting add product form to database
router.post('/add-product', (req, res) => {

  console.log("🐸🐸🐸🐸 : ",req.files)
  // Calling function for uploading add product form
  adminHelper.addProduct(req.body).then((id) => {

    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3
    image1.mv('./public/uploads/' + id + '__1.jpg')
    image2.mv('./public/uploads/' + id + '__2.jpg')
    image3.mv('./public/uploads/' + id + '__3.jpg')

    // redirecting to admin add product after completing the upload
    res.redirect('/admin/add-product');
  })
})


router.get('/view-product', (req, res) => {
  adminHelper.getAllproducts().then((products) => {
    res.render('admin/admin-productview', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, products, weatherDet })
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
router.get('/edit-product/:id', async (req, res) => {
  let productDetails = await adminHelper.getProductToEdit(req.params.id)
  adminHelper.fetchAllMainCategories().then((allCategories) => {
    adminHelper.findAllProductBrands().then((allProductBrands) => {
      adminHelper.getAllbikebrands().then((allBikeBrands) => {
        res.render('admin/admin-editproduct', { productDetails, typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allCategories, allProductBrands, allBikeBrands, weatherDet })
      })
    })
  })
})
// TO get the product to edit when clicked on the on the edit button 
router.post('/edit-product/:id', async (req, res) => {
  // var proId = req.params.id
  adminHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-product')
    if (req.files.image1 || req.files.image2 || req.files.image3) {
      let image1 = req.files.image1
      let image2 = req.files.image2
      let image3 = req.files.image3
      image1.mv('./public/uploads/' + req.params.id + '__1.jpg')
      image2.mv('./public/uploads/' + req.params.id + '__2.jpg')
      image3.mv('./public/uploads/' + req.params.id + '__3.jpg')
    }

  })
})
// TO logout
router.get('/logout', (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/admin/login')
})

router.get('/usermanagement', async (req, res) => {
  let allUsers = await adminHelper.getAllUsers()
  res.render('admin/admin-usermanagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allUsers, weatherDet })
})

router.get('/blockuser/:id', (req, res) => {
  id = req.params.id
  adminHelper.blockUser(id).then((response) => {
    if (response) {
      res.redirect('/admin/usermanagement')  
    }
  })
})

router.get('/unblockuser/:id', (req, res) => {
  id = req.params.id
  adminHelper.unBlockUser(id).then((response) => {
    if (response) {
      res.redirect('/admin/usermanagement')
    }
  })
})

router.get('/ordermanagement', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.getAllOrders().then((orders) => {
      res.render('admin/admin-ordermanagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, orders, weatherDet })
    })
  } else {
    res.redirect('/admin/login');
  }
})

router.post('/updateorderstatus', (req, res) => {
  adminHelper.updateOrderStatus(req.body.orderId, req.body.userId, req.body.status, req.body.proId).then((response) => {
    res.json(response)
  })
})

router.post('/updateorderstatusofbuynow', (req, res) => {
  adminHelper.updateOrderStatusofbuynow(req.body.orderId, req.body.userId, req.body.status, req.body.proId).then((response) => {
    res.json(response)
  })
})

router.get('/viewoderlist/:orderId/:userId', (req, res) => {
  adminHelper.getUserCartOrders(req.params.orderId, req.params.userId).then((cartOrders) => {
    userDet = cartOrders[0]
    console.log("the cart order : ", cartOrders[0])
    res.render('admin/admin-veiwcartorders', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, cartOrders, weatherDet,userDet })
  })
})
router.get('/viewoderlistofBuyNow/:orderId/:userId', (req, res) => {
  adminHelper.getBuyNowOrders(req.params.userId, req.params.orderId).then((buynowOrders) => {
    console.log("the buynow : ",buynowOrders)
    res.render('admin/admin-veiwbuynoworders', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, buynowOrders, weatherDet })
  })

})

router.get('/addmaincategory', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.fetchAllMainCategories().then((allCategories) => {
      res.render('admin/admin-adminmaincategory', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allCategories, catDeleted: req.session.catDeleted, NewcatAdded: req.session.NewcatAdded, weatherDet })
      req.session.catDeleted = false
      req.session.NewcatAdded = false
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addmaincategory', (req, res) => {
  adminHelper.addNewMainCat(req.body).then(() => {
    req.session.NewcatAdded = 'New Category successfully Added'
    res.redirect('/admin/addmaincategory')
  })

})
router.post('/addsubcat', (req, res) => {
  adminHelper.addSubCategory(req.body).then((id) => {
    let image = req.files.subCatImg
    image.mv('./public/subCat Logo/' + id + '__1.jpg')
    res.redirect('/admin/addmaincategory')
  })
})
router.get('/deletesubcat/', (req, res) => {
  adminHelper.deleteSubcat(req.query.index, req.query.id, req.query.name).then(() => {
    res.redirect('/admin/addmaincategory')
  })
})

router.get('/deletecategory/:id', (req, res) => {
  adminHelper.deleteCategory(req.params.id).then(() => {
    req.session.catDeleted = 'Category Deleted Successfully'
    res.redirect('/admin/addmaincategory')
  })
})

router.get('/brands', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.findAllProductBrands().then((allBrands) => {
      res.render('admin/admin-addbrand', ({ typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allBrands, proBrandAddSuccess: req.session.proBrandAddSuccess, brandDeleteSuccess: req.session.brandDeleteSuccess, weatherDet }))
      req.session.brandDeleteSuccess = false
      req.session.proBrandAddSuccess = false
    })
  } else {
    res.redirect('/admin/login')
  }

})

router.post('/addprobrand', (req, res) => {
  adminHelper.addProBrand(req.body.brandName).then((id) => {
    let proLogo = req.files.productlogo;
    proLogo.mv('./public/product brand logos/' + id + '__1.jpg')
    req.session.proBrandAddSuccess = 'New Brand added successfully'
    res.redirect('/admin/brands')
  })
})
router.get('/deletebrand/:id', (req, res) => {
  adminHelper.deleteBrand(req.params.id).then(() => {
    req.session.brandDeleteSuccess = 'Brand have been successfully deleted';
    res.redirect('/admin/brands')
  })
})

router.get('/bikebrands', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelpers.getAllbikebrands().then((allBikeBrands) => {
      res.render('admin/admin-bikebrands', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allBikeBrands, bikebrandDelted: req.session.bikebrandDelted, weatherDet })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addbikebrand', (req, res) => {
  adminHelper.addBikeBrand(req.body.brandName).then((id) => {
    let bikeLogo = req.files.productlogo;
    bikeLogo.mv('./public/bike brand logos/' + id + '__1.jpg')
    req.session.proBrandAddSuccess = 'New Brand added successfully'
    res.redirect('/admin/bikebrands')
  })
})


router.post('/addbikemodel', (req, res) => {
  adminHelper.addBikeModel(req.body).then(([result, id]) => {
    let logo = req.files.modelLogo
    logo.mv('./public/bike model logos/' + id + '__1.jpg')
    res.redirect('/admin/bikebrands')
  })
})

router.get('/deletebikemodel/', (req, res) => {
  adminHelper.deleteBikeModel(req.query.index, req.query.id, req.query.name).then(() => {
    res.redirect('/admin/bikebrands')
  })
})

router.get('/deletebikebrand/:id', (req, res) => {
  adminHelper.deleteBikeBrand(req.params.id).then(() => {
    req.session.bikebrandDelted = 'The brand has been removed successfully'
    res.redirect('/admin/bikebrands')
  })
})

router.get('/coupons', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.getAllCoupons().then((allCoupons) => {
      res.render('admin/admin-addcoupon', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, allCoupons, weatherDet })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addcoupon', (req, res) => {
  adminHelper.addCoupon(req.body).then(() => {
    res.redirect('/admin/coupons')
  })
})

router.get('/editcoupon/:couponId', (req, res) => {

  adminHelper.getAllCoupons().then((allCoupons) => {
    var coupon = adminHelper.getCouponToEdit(req.params.couponId).then((couponToEdit) => {
      res.json(couponToEdit)
    })
  })
})

router.post('/editcoupon', (req, res) => {
  adminHelper.editCoupon(req.body).then(() => {
    res.redirect('/admin/coupons')
  })
})

router.get('/deletecoupon/:couponId', (req, res) => {
  adminHelper.deleteCoupon(req.params.couponId).then(() => {
    res.redirect('/admin/coupons')
  })
})

router.get('/report', (req, res) => {
  adminHelper.getAllOrders().then((orders) => {
    adminHelper.getDeliveredOrders().then(([buyNowDo, cartDo]) => {
      var deliveredOrders = [...buyNowDo, ...cartDo]
      deliveredOrders = deliveredOrders.sort(function (a, b) { return new Date(b.orderDate) - new Date(a.orderDate) });

      res.render('admin/admin-report', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, orders, weatherDet, orderSortedInDate: req.session.orderSortedInDate, deliveredOrders, deliveredReportonDate: req.session.deliveredReportonDate })
    })
  })
})
router.get('/report/:re', (req, res) => {
  req.session.deliveredReportonDate = false
  req.session.orderSortedInDate = false
  res.redirect('/admin/report')
})

router.get('/offermanagement', (req, res) => {
  adminHelper.getAllCatOffers().then((offers) => {
    adminHelper.fetchAllMainCategories().then((allCats) => {
      res.render('admin/admin-offerManagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, weatherDet, offers, allCats })
    })
  })
})

router.post('/addcatoffer', (req, res) => {
  adminHelper.addNewCatOffer(req.body).then((products) => {
    products.map((proDetails) => {
      adminHelper.updatePrice(proDetails).then((response) => {
        res.redirect('/admin/offermanagement')
      })
    })
  })
})

router.get('/checkoffer/:offercat', (req, res) => {
  adminHelper.checkOffer(req.params.offercat).then((response) => {
    res.json(response)
  })
})

router.get('/deleteoffer/', (req, res) => {

  adminHelper.deleteoffer(req.query.offerId, req.query.category,req.query.offername).then((products) => {
    products.map((productToUpdate) => {
      adminHelper.updateProductsWhenOfferDeleted(productToUpdate).then((response) => {
        res.json(response)
      })
    })
  })
})

router.get('/deleteProoffer/',(req,res)=>{
  adminHelper.deleteProOffer(req.query.offerId, req.query.proName).then((response)=>{
    res.json(response)
  })
})

router.get('/productoffers', async (req, res) => {
  if (req.session.adminLoggedIn) {
    var offers = await adminHelpers.getAllProductOffer()
    adminHelpers.getAllproducts().then((products) => {
      res.render('admin/admin-productoffers', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, weatherDet, products, offers })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.get('/checkproducthaveoffer/:proId', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.checkProductHaveOffer(req.params.proId).then((reponse) => {
      res.json(reponse)
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/addprooffer', (req, res) => {
  adminHelper.addProOffer(req.body).then(() => {
    res.redirect('/admin/productoffers')
  })
})

router.get('/getreportondate/:from/:to', (req, res) => {
  adminHelper.getOrderReportOnDate(req.params.from, req.params.to).then((orderSortedInDate) => {
    req.session.orderSortedInDate = orderSortedInDate
    res.redirect('/admin/report')
  })
})

router.get('/getorderdetails/:id', (req, res) => {
  adminHelper.getSpecificOrder(req.params.id).then((order) => {
    res.json(order)
  })
})

router.get('/deliverygetreportondate/:from/:to', (req, res) => {
  adminHelper.getDeliveryOnDate(req.params.from, req.params.to).then(([buyNowOrders, cartOrders]) => {
    deliveredReportonDate = [...buyNowOrders, ...cartOrders]
    req.session.deliveredReportonDate = deliveredReportonDate.sort(function (a, b) { return new Date(b.orderDate) - new Date(a.orderDate) });
    res.redirect('/admin/report')
  })
})

router.get('/admanagement', (req, res) => {
  if (req.session.adminLoggedIn) {
    adminHelper.getAllCatOffers().then((offers)=>{
      adminHelper.getAllproducts().then((products)=>{
        res.render('admin/admin-admanagement', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, weatherDet, offers,products })
      })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/topad1', (req, res) => {
  adminHelper.addAds(req.body).then((id) => {
    let image1 = req.files.topimage1
    image1.mv('./public/ads/' + id + '__1.jpg')
    res.redirect('/admin/admanagement')
  })
})

router.post('/topad2', (req, res) => {
  console.log('HE  : ',req.body)
  adminHelper.addProAds(req.body).then((id) => {
    let image2 = req.files.topimage2
    image2.mv('./public/ads/' + id + '__1.jpg')
    res.redirect('/admin/admanagement')
  })
})

router.post('/topad3', (req, res) => {
  adminHelper.addAds(req.body).then((id) => {
    let image3 = req.files.topimage3
    image3.mv('./public/ads/' + id + '__1.jpg')
    res.redirect('/admin/admanagement')
  })
})

router.get('/viewads',async(req,res)=>{
  if(req.session.adminLoggedIn){
    var ads = await userHelpers.getAllAdsForOffer()
    res.render('admin/admin-viewads', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, weatherDet, ads })
  }else{
    res.redirect('/admin/login')
  }
})

router.get('/deletead/:adId',(req,res)=>{
 
  adminHelper.deleteAd(req.params.adId).then((response)=>{
    res.json(response)
  })
})

router.post('/getthesubcat/:maincat',(req,res)=>{
  adminHelper.getTheSubCatOfMainCat(req.params.maincat).then((subcats)=>{
    res.json(subcats)
  })
})

router.post('/getbikemodels/:bikebrand',(req,res)=>{
  adminHelper.getAllBikeModels(req.params.bikebrand).then((models)=>{
    console.log("The models are  : ",models)
    res.json(models)
  })
})

router.get('/test',(req,res)=>{
  res.render('admin/test', { typeOfPersonAdmin: true, adminHeader: true, adminNav: true, weatherDet })
})
module.exports = router;
