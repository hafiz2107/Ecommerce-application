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
               resolve(response)
           })
           
       })
   },
//    To make upload the changes made to the product
   updateProduct : (productId,data)=>{
       return new Promise((resolve, reject,)=>{
           db.get().collection(collection.newproducts).updateOne({_id: objectId(productId)},{$set:{productname:data.productname,category:data.category,productbrand:data.productbrand,suitablebikebrand:data.suitablebikebrand,suitablebikemodel:data.suitablebikemodel,productprice:data.productprice,productquantity:data.productquantity,productdate:data.productdate,productdes:data.productdes}}).then((result)=>{
               resolve();
           })
       })
   },
// To delte a product
   deleteproduct : (productId)=>{
       return new Promise((resolve, reject)=>{
           db.get().collection(collection.newproducts).deleteOne({ _id: objectId(productId) }).then((result) => {
               resolve(result);
       })
       
       })
   },
   getAllUsers : ()=>{
       return new Promise(async(resolve,reject)=>{
          let allUser = await db.get().collection(collection.userDatabase).find().toArray()
          resolve(allUser);
       })
   },
   blockUser : (userId)=>{
    return new Promise(async(resolve,reject)=>{
        let user = await db.get().collection(collection.userDatabase).updateOne({_id:objectId(userId)},{$set:{block:'true'}})
        resolve(user)
    })
   },
    unBlockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let unBlockuser = await db.get().collection(collection.userDatabase).update({_id: objectId(userId)},{$set:{block:'false'}})
            resolve(unBlockuser)
        })
    },
    getAllOrders : ()=>{
        return new Promise(async(resolve,reject)=>{
            var orders = await db.get().collection(collection.orders).find().toArray()
            resolve(orders)
        })
    },
    updateOrderStatus : (orderId,userId,orderStatus)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.orders).updateOne({_id: objectId(orderId)},{$set:{status:orderStatus}}).then((response)=>{
                resolve(response);
            })
        })
    },
    getUserCartOrders : (orderId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            var cartOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $unwind:'$delivery'
                },
                {
                    $project: {
                        proId: '$products.item',
                        userId : '$userId',
                        proName: '$products.productname',
                        proPrice: '$products.price',
                        status: '$status',
                        date: '$orderDate',
                        total: '$totalAmount',
                        userName : '$delivery.firstname',
                        destination : '$delivery.pincode',
                        payement: '$payment_method',
                    }
                }
            ]).toArray()
            console.log('@Get cart products : ',cartOrders)
            resolve(cartOrders)
        })    
       
    }
}