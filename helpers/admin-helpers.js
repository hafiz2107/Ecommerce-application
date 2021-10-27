var collection = require('../config/collection')
var db = require('../config/connection')
var objectId = require('mongodb').ObjectId

module.exports = {
    // TO add a product
    addProduct: (productData) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.newproducts).insertOne(productData).then(async (data) => {
                resolve(data.insertedId);
            })
        })
    },
    //    To get all products in view products
    getAllproducts: () => {
        return new Promise(async (resolve, reject) => {
            var productData = await db.get().collection(collection.newproducts).find().toArray();
            resolve(productData);
        })
    },
    //    To get a product on edit product page
    getProductToEdit: (productId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.newproducts).findOne({ _id: objectId(productId) }).then((response) => {
                resolve(response)
            })

        })
    },
    //    To make upload the changes made to the product
    updateProduct: (productId, data) => {
        return new Promise((resolve, reject,) => {
            db.get().collection(collection.newproducts).updateOne({ _id: objectId(productId) }, { $set: { productname: data.productname, category: data.category, productbrand: data.productbrand, suitablebikebrand: data.suitablebikebrand, suitablebikemodel: data.suitablebikemodel, productprice: data.productprice, productquantity: data.productquantity, productdate: data.productdate, productdes: data.productdes } }).then((result) => {
                resolve();
            })
        })
    },
    // To delte a product
    deleteproduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.newproducts).deleteOne({ _id: objectId(productId) }).then((result) => {
                resolve(result);
            })

        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let allUser = await db.get().collection(collection.userDatabase).find().toArray()
            resolve(allUser);
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.userDatabase).updateOne({ _id: objectId(userId) }, { $set: { block: 'true' } })
            resolve(user)
        })
    },
    unBlockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            let unBlockuser = await db.get().collection(collection.userDatabase).update({ _id: objectId(userId) }, { $set: { block: 'false' } })
            resolve(unBlockuser)
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            var orders = await db.get().collection(collection.orders).find().toArray()
            resolve(orders)
        })
    },
    updateOrderStatus: (orderId, userId, orderStatus, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: objectId(orderId), products: { $elemMatch: { item: objectId(proId) } } }, { $set: { 'products.$.status': orderStatus } }).then((response) => {
                resolve(response);
            })
        })
    },
    getUserCartOrders: (orderId, userId) => {
        return new Promise(async (resolve, reject) => {
            var cartOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $unwind: '$delivery'
                },
                {
                    $project: {
                        proId: '$products.item',
                        // Want to add a proId field for item that have beign puchased via buy now
                        userId: '$userId',
                        proName: '$products.productname',
                        proPrice: '$products.price',
                        status: '$products.status',
                        date: '$orderDate',
                        total: '$totalAmount',
                        userName: '$delivery.firstname',
                        destination: '$delivery.pincode',
                        payement: '$payment_method',
                    }
                }
            ]).toArray()
            resolve(cartOrders)
        })

    }, addNewMainCat: (catDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.productCat).insertOne(catDetails).then((response) => {
                console.log("The inserterd details  : ", catDetails);
                resolve(catDetails)
            })
        })

    }, fetchAllMainCategories: () => {
        return new Promise(async (resolve, reject) => {
            var allCategories = await db.get().collection(collection.productCat).find().toArray()

            if (allCategories) {
                resolve(allCategories)
            }
            else {
                resolve(false)
            }
        })
    }, addSubCategory: (catData) => {
        return new Promise(async (resolve, reject) => {


            db.get().collection(collection.productCat).updateOne({ _id: objectId(catData.mainCatId) }, { $push: { SubCategory: catData.subCat } }).then((id) => {
                resolve();
            })
        })
    },
    deleteSubcat: (index, id, subName) => {
        return new Promise((resolve, reject) => {
            SubCategory = `SubCategory. ${index}`
            db.get().collection(collection.productCat).updateOne({ _id: objectId(id) }, { $pull: { SubCategory: subName } }).then((response) => {

                resolve()
            })
        })

    },
    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.productCat).deleteOne({ _id: objectId(id) }).then(() => {
                resolve()
            })

        })
    },
    addProBrand: (brand) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.proBrands).insertOne({ ProBrand: brand }).then((result) => {
                resolve(result.insertedId)
            })
        })
    }, findAllProductBrands: () => {
        return new Promise(async (resolve, reject) => {
            var allBrands = await db.get().collection(collection.proBrands).find().toArray();
            resolve(allBrands);
        })
    }, deleteBrand: (brandId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.proBrands).deleteOne({ _id: objectId(brandId) }).then((result) => {
                console.log("RAESULT : ", result);
                resolve();
            })
        })
    },
    addBikeBrand: (bikeBrand) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.bikeBrands).insertOne({ bikeBrand: bikeBrand }).then((result) => {
                resolve(result.insertedId)
            })
        })
    },
    getAllbikebrands: () => {
        return new Promise(async (resolve, reject) => {
            var brands = await db.get().collection(collection.bikeBrands).find().toArray()
            resolve(brands)
        })
    }, addBikeModel: (models) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.bikeBrands).updateOne({ _id: objectId(models.bikeBrandId) }, { $push: { models: models.bikemodel } }).then((result) => {

               
                resolve(result)
            })
        })
    }, deleteBikeModel: (index, id, name) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.bikeBrands).updateOne({ _id: objectId(id) }, { $pull: { models: name } }).then((result) => {
                resolve()
            })
        })
    }, 
    deleteBikeBrand: (id) => {
        console.log('hhhhhhhh', id);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.bikeBrands).deleteOne({ _id: objectId(id) }).then((result) => {
                console.log('🦠🦠🦠🦠🦠🦠🦠🦠🦠🦠🦠🦠🦠 : ', result);
                resolve();
            })
        })

    }
}