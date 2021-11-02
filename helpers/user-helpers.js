var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { response } = require('express')
const Razorpay = require('razorpay');
const { resolve } = require('path')
const { DayContext } = require('twilio/lib/rest/bulkexports/v1/export/day')
const { v4: uuidv4 } = require('uuid');
const { wishlist } = require('../config/collection')

var instance = new Razorpay({
    key_id: 'rzp_test_6unoyhPHG9D97d',
    key_secret: 'cN0l9zD6cn9mh8DdO2hvfdad',
});


module.exports = {

    // Function to find the user with the ID
    findTheUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection(collection.userDatabase).findOne({ _id: objectId(userId) })
            resolve(user)
        })
    },

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

                await db.get().collection(collection.userDatabase).findOne({ mobile: userData.mobile }).then(async (mobile) => {
                    if (mobile) {
                        resolve(false)
                    } else {

                        resolve(true);
                    }
                })

            }
        })

    },

    // Inserting new user to DB after verifying the mobile
    insertNewUserToDB: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.pwd = await bcrypt.hash(userData.pwd, 10)
            userData.pwdc = await bcrypt.hash(userData.pwdc, 10)
            userData.block = 'false';
            var details = await db.get().collection(collection.userDatabase).insertOne(userData)
            var data = await db.get().collection(collection.userDatabase).findOne({ _id: details.insertedId })
            resolve(data)
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
    fetchProducts : ()=>{
        return new Promise(async (resolve, reject) => {
            var allProducts = await db.get().collection(collection.newproducts).find().toArray();
            resolve(allProducts)
        })
    },
    
    // TO get a single peoduct form database
    singleProduct : (productId) => {
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
            var user = await db.get().collection(collection.userDatabase).findOne({ $and: [{ mobile: mobile }, { countryCode: country }] })
            if (user) {
                resolve(user)
            } else {
                resolve(false)
            }
        })
    },
    // To find th user of a specified mobile number
    findUser: (mobile) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.userDatabase).findOne({ mobile: mobile })
            if (user) {
                resolve(user)
            } else {
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


    // function to add the products to cart whenn add to cart is clicked
    addToCart: (proId, userId, proPrice, proName) => {

        let proObj = {
            item: objectId(proId),
            name: proName,
            quantity: 1,
            price: parseInt(proPrice),
            totalprice: parseInt(proPrice),
            status: 'pending'
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.cartItems).findOne({ user: objectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)

                if (proExist != -1) {
                    db.get().collection(collection.cartItems).updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, { $inc: { 'products.$.quantity': 1 } }).then(() => {
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

    // Function to get the the products in the cart when cart is opened
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

            if (cartItems[0]) {
                resolve(cartItems)
            } else {
                resolve(false)
            }

        })
    },

    // function to get  the cart count
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

    // Function to change the quantity of the products in the cart by 1 or -1
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
            } else {
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product_id) },
                    {
                        $inc: { 'products.$.quantity': details.count, 'products.$.totalprice': details.price * details.count }
                    }
                ).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },

    // Function to delete the product from the cart
    deleteProduct: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart) },
                {
                    $pull: { products: { item: objectId(details.product_id) } }
                }
            ).then((response) => {
                resolve(true)
            })
        })
    },

    // Function to get the total amount of the cart
    getTotalAmount: (userId) => {
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
                    },
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: '$totalprice' }
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

    placeOrderOnCart: (orderDetails, products, productprice ,couponCode) => {
        
        return new Promise((resolve, reject) => {
            let status = orderDetails.payment_method == 'COD' ? 'placed' : 'pending';
            let orderObj = {
                userId: objectId(orderDetails.userId),
                delivery: {
                    firstname: orderDetails.firstname,
                    lastname: orderDetails.lastname,
                    mobile: orderDetails.phone,
                    address: orderDetails.addressline1,
                    address2: orderDetails.addressline2,
                    city: orderDetails.city,
                    pincode: orderDetails.pincode,
                    alternatenumber: orderDetails.alternatenumber,
                },

                products: products,
                totalAmount: parseInt(productprice),
                coupon: couponCode,
                orderDate: new Date().toISOString().slice(0, 10),
                payment_method: orderDetails.payment_method,
                mode: 'cartorder',
                status: status
            }
            db.get().collection(collection.orders).insertOne(orderObj).then((repsonse) => {
                resolve(repsonse.insertedId)
            })
        })
    },

    // Function to place the order on Buy now
    placeOrder: (orderDetails, products, totalAmount) => {
        return new Promise((resolve, reject) => {
            let status = orderDetails.payment_method == 'COD' ? 'placed' : 'pending';
            let orderObj = {
                userId: objectId(orderDetails.userId),
                delivery: {
                    firstname: orderDetails.firstname,
                    lastname: orderDetails.lastname,
                    mobile: orderDetails.phone,
                    address: orderDetails.addressline1,
                    address2: orderDetails.addressline2,
                    city: orderDetails.city,
                    pincode: orderDetails.pincode,
                    alternatenumber: orderDetails.alternatenumber,
                },
                productId: products._id,
                productName: products.productname,
                productbrand: products.productbrand,
                productprice: products.productprice,
                totalAmount: totalAmount,
                coupon: orderDetails.coupon,
                orderDate: new Date().toISOString().slice(0, 10),
                payment_method: orderDetails.payment_method,
                mode: 'buynow',
                status: status
            }
            db.get().collection(collection.orders).insertOne(orderObj).then((repsonse) => {
                resolve(repsonse.insertedId)
            })
        })
    },



    // Function to delte the cart products after making order
    deleteCartProductsAfterOrder: (userId) => {
        db.get().collection(collection.cartItems).deleteOne({ user: objectId(userId) })
    },

    // function to get cart products to display in view orders page
    getCartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.cartItems).findOne({ user: objectId(userId) })
           
            resolve(cart.products)
        })

    },
    // Function to find user who made the order and get the orders made by him
    getUserOrders: (user) => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection(collection.orders).find({ userId: objectId(user) }).toArray()
            resolve(orders)
        })

    },
    // Function to get the single products that are ordered by the user
    getSingleOrderedProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            // Doing aggregation
            products = await db.get().collection(collection.orders).find({ _id: objectId(orderId) }).toArray()
            resolve(products)
        })
    },

    // Function to generate the razor pay
    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalPrice * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderId,
            };
            instance.orders.create(options, function (err, order) {
                if(err){
                    reject(err)
                }else{
                    resolve(order)
                }
            });
        })
    },

    // Function to check the payement made is correct
    verifyPayment: (details,userId) => {
        return new Promise((resolve, reject) => {
            let crypto = require("crypto")
            let hmac = crypto.createHmac("sha256", "cN0l9zD6cn9mh8DdO2hvfdad")
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest("hex");
            if (hmac == details['payment[razorpay_signature]']) {
                // var deleteCart = function (){
                //     this.deleteCartProductsAfterOrder(userId);
                // }
                // deleteCart.call(module.exports)
                resolve()
            } else {
                reject()
            }
        })
    },

    // To change the payement status of the products that are ordered to placed
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.orders).updateOne(
                {
                    _id: objectId(orderId)
                }, {
                $set:
                {
                    status: 'placed'
                }
            }
            ).then(() => {
                resolve();
            })
        })
    },
    // Getting a product for buy now
    getProductForBuyNow: (proId) => {
        return new Promise(async (resolve, reject) => {
            var product = await db.get().collection(collection.newproducts).findOne({ _id: objectId(proId) })
            resolve(product)
        })
    },

    // Function to find an user
    getUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.userDatabase).findOne({ _id: objectId(userId) })
            resolve(user);
        })
    },
    editUserProfile: (userId, details) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.userDatabase).updateOne({ _id: objectId(userId) },
                {
                    $set:
                    {
                        firstname: details.firstname,
                        lastname: details.lastname,
                        email: details.email,
                        mobile: details.mobile,
                        second_mobile: details.secondphone,
                      
                        address1: details.address1,
                        address2: details.address2,
                        
                        country: details.country,
                        state: details.state,
                        pincode: details.pincode,
                    }
                }).then((response) => {
                    resolve(response);
                })
        })
    },
    getAllOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            var orders = await db.get().collection(collection.orders).find({ userId: objectId(userId) }).toArray()
            resolve(orders)
        })
    },
    getTheCurrentOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            var order = await db.get().collection(collection.orders).findOne({ _id: objectId(orderId) })
            resolve(order)
        })
    },

    AddNewAddress: (newAddress, userId) => {
        let addressDetails = {
            _id: uuidv4(),
            firstname: newAddress.firstname,
            lastname: newAddress.lastname,
            phone: newAddress.phone,
            second_mobile: newAddress.second_mobile,
            housename: newAddress.housename,
            address1: newAddress.address1,
            address2: newAddress.address2,
            city: newAddress.city,
            state: newAddress.state,
            country: newAddress.country,
            pincode: newAddress.pincode,
            addresstype: newAddress.addresstype
        }
        return new Promise(async (resolve, reject) => {

            let userAddress = await db.get().collection(collection.userAddress).find({ user: objectId(userId) }).toArray()

            if (userAddress.length > 0) {
                db.get().collection(collection.userAddress).updateOne({ user: objectId(userId) }, { $push: { address: addressDetails } }).then((response) => {
                    resolve(response);
                })
            } else {
                let address = {
                    user: objectId(userId),
                    address: [addressDetails]
                }

                db.get().collection(collection.userAddress).insertOne(address).then((id) => {
                    resolve(id);
                })
            }
        })
    },
    getUserAddresses: (userId) => {
        return new Promise(async (resolve, reject) => {
            var address = await db.get().collection(collection.userAddress).find({ user: objectId(userId) }).toArray()

            if (address.length > 0) {
                resolve(address[0].address);
            } else {
                resolve(false)
            }
        })

    },
    getUserAddressesToEdit: (userId, AddressId) => {
        return new Promise(async (resolve, reject) => {
            var address = await db.get().collection(collection.userAddress).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$address"
                },

                {
                    $match: { "address._id": AddressId }
                }
            ]).toArray()
            resolve(address[0].address)
        })
    },

    editUserAddress: (editedAddress, userId, addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.userAddress).updateOne({ user: objectId(userId) ,address : {$elemMatch:{_id:addressId}}}, 
            { 
                $set: { 
                 'address.$.firstname': editedAddress.firstname,
                 'address.$.lastname': editedAddress.lastname, 
                 'address.$.phone': editedAddress.phone, 
                 'address.$.second_mobile': editedAddress.second_mobile, 
                 'address.$.address1': editedAddress.address1, 
                 'address.$.address2': editedAddress.address2, 
                 'address.$.state': editedAddress.state, 
                 'address.$.country': editedAddress.country, 
                 'address.$.pincode': editedAddress.pincode, 
                 'address.$.addresstype': editedAddress.addresstype
                }
        }).then((response) => {
                resolve(response)
            })
        })
    },deleteAddress : (addressId, userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.userAddress).updateOne({ user: objectId(userId) }, { $pull: { address: { _id: addressId}}},{multi : true}).then((response)=>{
              
                resolve(response)
            })
        })
    },
    findUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            var adress = await db.get().collection(collection.userAddress).find({ user: objectId(userId) }).toArray()

            resolve(adress[0])
        })
    },
    // Decreasing product quantity on buy now
    decreaseProductQuantity: (proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.newproducts).updateOne({ _id: objectId(proId) }, { $inc: { productquantity: -1 } }).then((result) => {
                resolve()
            })
        })
    },
    // decreasing pro quantity on cart order
    decreseQuantityOncartOrder : (products)=>{
        return new Promise((resolve,reject)=>{
            for(key in products){
                quantity = products[key].quantity*-1
                db.get().collection(collection.newproducts).updateOne({ _id: objectId(products[key].item) }, { $inc: { productquantity: quantity}})
            } 
            resolve()
        })
    },
    cancelBuynowOrder: (orderId, proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: objectId(orderId) }, { $set: { status: 'cancel' } }).then((response) => {
                db.get().collection(collection.newproducts).updateOne({ _id: objectId(proId) }, { $inc: { productquantity: 1 } }).then((result) => {
                    resolve();

                })
            })
        })
    },
    cancelCartOrders: (orderId, proId, quantity) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: objectId(orderId), products: { $elemMatch: { item: objectId(proId) } } }, { $set: { 'products.$.status': 'cancel' } }).then(() => {
                db.get().collection(collection.newproducts).updateOne({ _id: objectId(proId)}, {$inc: { productquantity: quantity}}).then((response) => {
                    resolve()
                })
            })
        })
    },
    checkCouponCode: (couponCode, proPrice, userId ) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.coupon).findOne({ couponcode: couponCode }).then((coupon) => {
                if (coupon) {
                    // Checking the coupon is already applied by the user
                    db.get().collection(collection.orders).findOne({ userId: objectId(userId), coupon: couponCode }).then((userAppliedCoupon) => {
                        if (userAppliedCoupon) {
                            resolve({ appliedCoupon: true })
                        } else {
                            proPrice = parseInt(proPrice)
                            var discount = (proPrice / 100) * parseInt(coupon.coupondiscount)
                            var priceAfterDiscount = proPrice - discount
                            resolve({ appliedCoupon: false, coupon, discount, priceAfterDiscount})
                        }
                    })
                } else {
                    resolve({ couponDontExist: true })
                }
            })
        })
    },
    addToWishlist : (proId , userId)=>{
        return new Promise(async(resolve,reject)=>{
            var product = await db.get().collection(collection.newproducts).findOne({_id : objectId(proId)})
            var wishObj = {
                item : objectId(proId),
                proName: product.productname,
                proPrice: product.productprice,
                quantity: product.productquantity,
            }

            var userWishlist = await db.get().collection(collection.wishlist).findOne({user:objectId(userId)})

            if (userWishlist){
                db.get().collection(collection.wishlist).updateOne({user : objectId(userId)},{$push : {products:wishObj}}).then((updatedResponse)=>{
                    resolve(updatedResponse)  
                })
            }else{
                var wishlist = {
                    user : objectId(userId),
                    products : [wishObj],
                }
                db.get().collection(collection.wishlist).insertOne(wishlist).then((response)=>{
                 
                    resolve(response)  
                })
            }

        })
    },
    getUserWish : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            var userWish = await db.get().collection(collection.wishlist).findOne({user : objectId(userId)})
            // resolving an array of objects containing products
            resolve(userWish.products)
        })
    },
    removeFromWish : (proId , userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.wishlist).updateOne({user :objectId(userId)},{$pull : {products:{item: objectId(proId)}}}).then((response)=>{
                resolve(response)
            })
        })
    }
}
