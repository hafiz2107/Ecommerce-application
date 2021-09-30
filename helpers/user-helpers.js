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
    getAllProducts : ()=>{
        return new Promise(async(resolve, reject)=>{
            var allProducts = await db.get().collection(collection.newproducts).find().toArray();
            console.log("All producst are : ",allProducts);
            resolve(allProducts)
        })
    },

    singleProduct : (productId)=>{
        return new Promise(async(resolve, reject)=>{
            var product = await db.get().collection(collection.newproducts).findOne({_id:objectId(productId)})

            console.log("THe categpry is : ",product.category);
            var relatedProduct = await db.get().collection(collection.newproducts).find({category:product.category}).limit(4).toArray()
            resolve([product , relatedProduct])
        })
    },
    forgotPassword : ()=>{

    },checkMobNo : (data)=>{
        console.log("The mobile number is : ",data)
        return new Promise(async(resolve,reject)=>{
            var mobile = data.mobileno
            var country = data.countryCode
            var user = await db.get().collection(collection.userDatabase).findOne({mobile : mobile})
            console.log(user);
            if(user){
                resolve(true)
            }else{
                resolve(true)
            }
        })
    }
}