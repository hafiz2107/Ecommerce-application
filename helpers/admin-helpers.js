var collection = require('../config/collection')
var db = require('../config/connection')
var objectId = require('mongodb').ObjectId

module.exports = {
    // TO add a product
   addProduct : (productData)=>{
       
       return new Promise((resolve, reject) =>{
               db.get().collection(collection.newproducts).insertOne(productData).then(async(data)=>{
               resolve(data.insertedId);
           })
       })
   },
//    To get all products in view products
   getAllproducts : ()=>{
       return new Promise(async(resolve, reject) =>{
           var productData = await db.get().collection(collection.newproducts).find().toArray();
           resolve(productData);
       })
   },
//    To get a product on edit product page
   getProductToEdit : (productId)=>{
       return new Promise(async(resolve, reject) =>{
           await db.get().collection(collection.newproducts).findOne({_id: objectId(productId)}).then((response)=>{
               console.log("repsonse isss : ",response);
               resolve(response)
           })
           
       })
   },
//    To make upload the changes made to the product
   updateProduct : (productId,data)=>{
       return new Promise((resolve, reject,)=>{
           console.log("asdas",productId);
           console.log("jkjlkj",data);
           db.get().collection(collection.newproducts).updateOne({_id: objectId(productId)},{$set:{productname:data.productname,category:data.category,productbrand:data.productbrand,suitablebikebrand:data.suitablebikebrand,suitablebikemodel:data.suitablebikemodel,productprice:data.productprice,productquantity:data.productquantity,productdate:data.productdate,productdes:data.productdes}}).then((result)=>{
               console.log("The uploadin gresult is : ",result);
               resolve();
           })
       })
   },
// To delte a product
   deleteproduct : (productId)=>{
       return new Promise((resolve, reject)=>{
           db.get().collection(collection.newproducts).deleteOne({ _id: objectId(productId) }).then((result) => {
               console.log("result after deleting product : ", result);
               resolve(result);
       })
       
       })
   },
}