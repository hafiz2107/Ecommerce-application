var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { response } = require('express')
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_6unoyhPHG9D97d',
    key_secret: 'cN0l9zD6cn9mh8DdO2hvfdad',
});


module.exports = {

    // User signup data uploading
    userSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            var allDatas = await db.get().collection(collection.userDatabase).findOne({ username: userData.username })

            if (allDatas == null) {
                allDatas = 'm'
            }

            if (allDatas.username == userData.username) {
                resolve(false)
            }
            else {
                userData.pwd = await bcrypt.hash(userData.pwd, 10)
                userData.pwdc = await bcrypt.hash(userData.pwdc, 10)
                var details = await db.get().collection(collection.userDatabase).insertOne(userData)
                var data = await db.get().collection(collection.userDatabase).findOne({ _id: details.insertedId })
                resolve(data);
            }
        })

    },
    // Checking Whwen logging in
    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {};
            var userDetails = await db.get().collection(collection.userDatabase).findOne({ username: userData.username });

            if (userDetails) {
                bcrypt.compare(userData.pwd, userDetails.pwd).then((status) => {
                    if (status) {
                        response.user = userDetails;
                        response.status = true
                        loginStatus = true;
                        resolve(response)
                    }
                    else {
                        response.passError = true;
                        resolve(response)
                    }
                })
            } else {
                response.emailError = true
                resolve(response)
            }
        })
    },
    // To get all products from database
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            var allProducts = await db.get().collection(collection.newproducts).find().toArray();
            resolve(allProducts)
        })
    },
    // TO get a single peoduct form database
    singleProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            var product = await db.get().collection(collection.newproducts).findOne({ _id: objectId(productId) })

            var relatedProduct = await db.get().collection(collection.newproducts).find({ category: product.category }).limit(4).toArray()
            resolve([product, relatedProduct])
        })
    },
    // To check the mobile number upon entering for OTP 
    checkMobNo: (data) => {
        return new Promise(async (resolve, reject) => {
            var mobile = data.mobileno
            var country = data.countryCode
            var user = data.user
            var user = await db.get().collection(collection.userDatabase).findOne({ mobile: mobile }, { countryCode: country })
            if (user) {
                resolve(user)
            } else {
                resolve(false)
            }
        })
    }, findUser : (mobile)=>{
        return new Promise(async(resolve,reject)=>{
            var user = await db.get().collection(collection.userDatabase).findOne({ mobile: mobile })
            if(user){
                resolve(user)
            }else{
                resolve(false)
            }
        })
    },
    // TO update the password When clicking  the forgotpassword
    updatePassword: (body, user) => {
        return new Promise(async (resolve, reject) => {
            body.newpass = await bcrypt.hash(body.newpass, 10)
            data = await db.get().collection(collection.userDatabase).updateOne({ _id: objectId(user._id) }, { $set: { pwd: body.newpass } })
            if (data) {
                resolve(data)
            } else {
                resolve(false)
            }
        })
    },
    addToCart: (proId, userId ,proPrice) => {

        let proObj = {
            item: objectId(proId),
            quantity: 1,
            price:parseInt(proPrice),
            totalprice: parseInt(proPrice),
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.cartItems).findOne({ user: objectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)

                if (proExist != -1) {
                    db.get().collection(collection.cartItems).updateOne({ user: objectId(userId), 'products.item': objectId(proId)}, { $inc: { 'products.$.quantity': 1 } }).then(() => {
                        resolve()
                    })
                }
                else {
                    db.get().collection(collection.cartItems).updateOne({ user: objectId(userId) }, { $push: { products: proObj } }).then((response) => {
                        resolve();
                    })
                }

            }
            else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.cartItems).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            // Doing aggregation
            let cartItems = await db.get().collection(collection.cartItems).aggregate([
                {
                    // Matching the element in the user field in the colleciton cartitems and anf taking that field
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        price: '$products.price',
                        totalprice : '$products.totalprice'
                    }
                }, {
                    $lookup: {
                        from: collection.newproducts,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        price : 1,
                        totalprice : 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }



            ]).toArray()
           
            if (cartItems[0]){
                resolve(cartItems)
            } else {
                resolve(false)
            }

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.cartItems).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        details.price = parseInt(details.price)

        return new Promise((resolve, reject) => {
// Removing the item when the user user is pressing - and the count is 1
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product_id) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            // }else if(details.count == -1){
            //     db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product_id) },
            //         {
            //             $inc: { 'products.$.quantity': details.count, 'products.$.totalprice': details.price*details.count }
            //         }
            //     ).then((response) => {
            //         resolve({ status : true })
            //     })
            // } 
            }else {
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product_id) },
                    {
                        $inc: { 'products.$.quantity': details.count, 'products.$.totalprice': details.price*details.count}
                    }
                ).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    deleteProduct : (details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart)},
            {
                $pull : { products: { item: objectId(details.product_id)}}
            }
            ).then((response)=>{
                resolve(true)
            })
        })
    },
    
        getTotalAmount : (userId)=>{
        return new Promise(async (resolve, reject) => {
            // Doing aggregation
            
            let total = await db.get().collection(collection.cartItems).aggregate([
                {
                    // Matching the element in the user field in the colleciton cartitems and anf taking that field
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        price: '$products.price',
                        totalprice : '$products.totalprice'
                    }
                }, {
                    $lookup: {
                        from: collection.newproducts,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item:1,
                        quantity: 1,
                        price: 1,
                        totalprice : 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    },
                },{
                    $group:{
                        _id:null,
                        total:  { $sum: '$totalprice' }
                    }
                }
            ]).toArray()

            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(false)
            }

        })
    },
    placeOrder : (orderDetails,products,totalAmount)=>{
        return new Promise((resolve,reject)=>{
            let status = orderDetails.payment_method == 'COD'?'placed':'pending';
            let orderObj = {
                userId: objectId(orderDetails.userId),
                
                delivery:{
                    firstname : orderDetails.firstname,
                    lastname  : orderDetails.lastname,
                    mobile : orderDetails.phone,
                    address : orderDetails.addressline1 + orderDetails.addressline2,
                    city : orderDetails.city,
                    pincode : orderDetails.pincode,
                    alternatenumber : orderDetails.alternatenumber,
                },
                
                payment_method : orderDetails.payment_method,
                products : products,
                totalAmount : totalAmount,
                orderDate: new Date().toISOString().slice(0, 10),
                status : status
            }
            db.get().collection(collection.orders).insertOne(orderObj).then((repsonse)=>{
                resolve(repsonse.insertedId)
                db.get().collection(collection.cartItems).deleteOne({user : objectId(userId)})
            })
        })
    },
    getCartProductList : (userId) =>{
        
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.cartItems).findOne({user : objectId(userId)})
            resolve(cart.products)  
        })
    }, getUserOrders : (user)=>{
           return new Promise(async(resolve,reject)=>{
               orders = await db.get().collection(collection.orders).find({userId : objectId(user)}).toArray()
               resolve(orders)
           })
       
    }, getSingleOrderedProducts : (orderId)=>{
        
        return new Promise(async (resolve, reject) => {
            // Doing aggregation
            let orderProducts = await db.get().collection(collection.orders).aggregate([
                {
                    // Matching the element in the user field in the colleciton cartitems and anf taking that field
                    $match: { _id:objectId(orderId)}
                },
                {
                    $unwind: '$products'
                },{
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        price: '$products.price',
                        totalprice: '$products.totalprice'
                    }
                }, {
                    $lookup: {
                        from: collection.newproducts,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        price: 1,
                        totalprice: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            
            if (orderProducts[0]) {
                resolve(orderProducts)
            } else {
                resolve(false)
            }

        })
    },
    generateRazorpay : (orderId,totalPrice)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: totalPrice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ''+orderId,
            };
            instance.orders.create(options, function (err, order) {
                console.log('Generator Razor err : ',err);
                console.log('@generate Razor : ',order);
                resolve(order)
            });
        })
    },
    verifyPayment : (details)=>{
        return new Promise((resolve,reject)=>{
            let crypto = require("crypto")
            let hmac = crypto.createHmac("sha256", "cN0l9zD6cn9mh8DdO2hvfdad")
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest("hex");
            if (hmac == details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus : (orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.order).updateOne(
                {
                    _id : objectId(orderId)
                },{
                    $set:
                        {
                            status:'placed'
                        }
                    }
            ).then(()=>{
                resolve();
            })
        })
    }

}
  