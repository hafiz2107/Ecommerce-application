var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId


module.exports = {

    // User signup data uploading
    userSignup : (userData)=>{
        return new Promise( async(resolve,reject)=>{
            var allDatas = await db.get().collection(collection.userDatabase).findOne({username:userData.username})

            if(allDatas == null){
                allDatas = 'm'
            }

            if (allDatas.username == userData.username)
            {
                resolve(false)
            }
            else{
                userData.pwd = await bcrypt.hash(userData.pwd, 10)
                userData.pwdc = await bcrypt.hash(userData.pwdc, 10)
                var details =await db.get().collection(collection.userDatabase).insertOne(userData)
                console.log("details is :", details);
                var data =await db.get().collection(collection.userDatabase).findOne({ _id: details.insertedId })
                resolve(data);
            }
        })
        
    },
// Checking Whwen logging in
    doLogin :(userData)=>{

        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {};
            var userDetails = await db.get().collection(collection.userDatabase).findOne({username:userData.username});
            console.log("User details : ",userDetails)
            
            if(userDetails){
                console.log("Comparing", userDetails.pwd, "And", userData.pwd)
                bcrypt.compare(userData.pwd, userDetails.pwd).then((status)=>{
                    console.log("The status is : ",status);
                    if(status){
                        response.user = userDetails;
                        response.status = true
                        loginStatus = true;
                        console.log("response : ",response);
                        resolve(response)
                    }
                    else{
                        console.log("Login Error");
                        response.passError = true;
                        resolve(response)
                    }
                })
            }else{
                console.log("Login Failed");
                response.emailError = true
                resolve(response)
            }
        })
    },
    // To get all products from database
    getAllProducts : ()=>{
        return new Promise(async(resolve, reject)=>{
            var allProducts = await db.get().collection(collection.newproducts).find().toArray();
            resolve(allProducts)
        })
    },
    // TO get a single peoduct form database
    singleProduct : (productId)=>{
        return new Promise(async(resolve, reject)=>{
            var product = await db.get().collection(collection.newproducts).findOne({_id:objectId(productId)})

            console.log("THe categpry is : ",product.category);
            var relatedProduct = await db.get().collection(collection.newproducts).find({category:product.category}).limit(4).toArray()
            resolve([product , relatedProduct])
        })
    },
    // To check the mobile number upon entering for OTP 
    checkMobNo : (data)=>{
        console.log("The mobile number is : ",data)
        return new Promise(async(resolve,reject)=>{
            var mobile = data.mobileno
            var country = data.countryCode
           var user = data.user
            var user = await db.get().collection(collection.userDatabase).findOne({mobile : mobile},{countryCode : country})
            console.log(user);
            if(user){
                resolve(user)
            }else{
                resolve(false)
            }
        })
    },
    // TO update the password When clicking  the forgotpassword
    updatePassword :  (body , user)=>{
        return new Promise(async (resolve, reject) => {
            body.newpass = await bcrypt.hash(body.newpass, 10)
            data = await db.get().collection(collection.userDatabase).updateOne({_id : objectId(user._id)},{$set:{pwd : body.newpass}})
            console.log("Data after setting password : ",data)
            if(data){
                resolve(data)
            }else{
                resolve(false)
            }
        })
    },
    addToCart : (proId , userId) =>{
        return new Promise(async(resolve,reject)=>{
            let userCart =  await db.get().collection(collection.cartItems).findOne({user : objectId(userId)})

            if(userCart){
                db.get().collection(collection.cartItems).updateOne({user : objectId(userId)},{$push : {products  : objectId(proId)}}).then((response)=>{
                    resolve();
                })
            }else{
                let cartObj = {
                    user : objectId(userId),
                    products : [objectId(proId)]
                }
                db.get().collection(collection.cartItems).insertOne(cartObj).then((response)=>{
                    resolve(response)
                })
                }
        })
    },
    getCartProducts : (userId) =>{
        return new Promise(async(resolve,reject)=>{
           
            // Doing aggregation
            let cartItems = await db.get().collection(collection.cartItems).aggregate([
                {
                    // Matching the element in the user field in the colleciton cartitems and anf taking that field
                    $match : {user : objectId(userId)}
                },
                {
                    // Going to another collection newproducts
                    $lookup : {
                        // Taking new products collection
                        from : collection.newproducts,

                        // Its an array from the cart collection , so it is stored in a variable
                        let  : {proList : '$products'},

                        // Then we are doing the opertion with that  collection amd the let object's key proList variable array
                        pipeline : [
                           {
                               $match : {
                                //  Then we are creating an expression to match the products id in the 
                                // cart item collection and new prducts collection.
                                   $expr : {
                                    //    the 'in' takes the id of produts from the proList that is stored with the array of products
                                    // that we are stored in the variable prolist.
                                        $in : ["$_id","$$proList"]
                                   }
                                //    And all the id that we have stored proList variable will be compared with the 
                                // Products that we have in our new products collection.
                               }
                           }
                        ],
                        // And at last the matched items will be stored in the cartItem in the 
                        // cartItems collection.
                        as : 'cartItems2'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems2)
        })
    }
    
} 