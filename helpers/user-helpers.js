var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId


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
                console.log("details is :", details);
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
            console.log("User details : ", userDetails)

            if (userDetails) {
                console.log("Comparing", userDetails.pwd, "And", userData.pwd)
                bcrypt.compare(userData.pwd, userDetails.pwd).then((status) => {
                    console.log("The status is : ", status);
                    if (status) {
                        response.user = userDetails;
                        response.status = true
                        loginStatus = true;
                        console.log("response : ", response);
                        resolve(response)
                    }
                    else {
                        console.log("Login Error");
                        response.passError = true;
                        resolve(response)
                    }
                })
            } else {
                console.log("Login Failed");
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

            console.log("THe categpry is : ", product.category);
            var relatedProduct = await db.get().collection(collection.newproducts).find({ category: product.category }).limit(4).toArray()
            resolve([product, relatedProduct])
        })
    },
    // To check the mobile number upon entering for OTP 
    checkMobNo: (data) => {
        console.log("The mobile number is : ", data)
        return new Promise(async (resolve, reject) => {
            var mobile = data.mobileno
            var country = data.countryCode
            var user = data.user
            var user = await db.get().collection(collection.userDatabase).findOne({ mobile: mobile }, { countryCode: country })
            console.log(user);
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
            console.log("Data after setting password : ", data)
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
                console.log("indec : ", proExist)

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
           
            if (cartItems[0]) {
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
        console.log("Teh detaisl are : ", details.price)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product_id) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            }else if(details.count == -1){
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product_id) },
                    {
                        $inc: { 'products.$.quantity': details.count, 'products.$.totalprice': details.price*details.count }
                    }
                ).then((response) => {
                    console.log("The details : ", details.price * details.count );

                    resolve(true)
                })
            } 
            else {
                console.log("The details are :  ", details);
                db.get().collection(collection.cartItems).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product_id) },
                    {
                        $inc: { 'products.$.quantity': details.count, 'products.$.totalprice': details.price}
                    }
                ).then((response) => {
                    console.log("The details : ",details.quantity*details.price);

                    resolve(true)
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
            let total = 0;
            total = await db.get().collection(collection.cartItems).aggregate([
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

                        quantity: 1,
                        price: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    },
                },{
                    $group:{
                        _id:null,
                        total: {$sum: { $multiply: ['$quantity','$price']}}
                    }
                }



            ]).toArray()

            if (total) {
                console.log("Asdsadasdasd : ",total[0].total);
                resolve(total[0].total)
            } else {
                resolve(false)
            }

        })
    }

}
