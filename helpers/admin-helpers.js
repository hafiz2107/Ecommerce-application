var collection = require('../config/collection')
var db = require('../config/connection')
var objectId = require('mongodb').ObjectId

module.exports = {

    findAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            var response = {}

            var allBuyNowPendingOrders = await db.get().collection(collection.orders).find({ mode: 'buynow', status: 'pending' }).count()
            var allBuyNowplacedOrders = await db.get().collection(collection.orders).find({ mode: 'buynow', status: 'placed' }).count()
            var allBuyNowshippedOrders = await db.get().collection(collection.orders).find({ mode: 'buynow', status: 'shipped' }).count()
            var allBuyNowdeliveredOrders = await db.get().collection(collection.orders).find({ mode: 'buynow', status: 'delivered' }).count()
            var allBuyNowcancelOrders = await db.get().collection(collection.orders).find({ mode: 'buynow', status: 'cancel' }).count()
            var date = new Date().toISOString().slice(0, 10)
            var totalOrdersToday = await db.get().collection(collection.orders).find({ orderDate: date}).count()
            

            var allCartpendingOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { mode: 'cartorder' }
                }, {
                    $unwind: '$products'
                }, {
                    $match: { 'products.status': 'pending' }
                }, {
                    $project: {
                        quantity: '$products.quantity'
                    }
                }, {
                    $group: {
                        _id: null,
                        totalPendingOrders: { $sum: '$quantity' }
                    }
                }
            ]).toArray()

            var allCartplacedOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { mode: 'cartorder' }
                }, {
                    $unwind: '$products'
                }, {
                    $match: { 'products.status': 'placed' }
                }, {
                    $project: {
                        quantity: '$products.quantity'
                    }
                }, {
                    $group: {
                        _id: null,
                        totalPendingOrders: { $sum: '$quantity' }
                    }
                }
            ]).toArray()

            var allCartshippedOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { mode: 'cartorder' }
                }, {
                    $unwind: '$products'
                }, {
                    $match: { 'products.status': 'shipped' }
                }, {
                    $project: {
                        quantity: '$products.quantity'
                    }
                }, {
                    $group: {
                        _id: null,
                        totalPendingOrders: { $sum: '$quantity' }
                    }
                }
            ]).toArray()

            var allCartdeliveredOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { mode: 'cartorder' }
                }, {
                    $unwind: '$products'
                }, {
                    $match: { 'products.status': 'delivered' }
                }, {
                    $project: {
                        quantity: '$products.quantity'
                    }
                }, {
                    $group: {
                        _id: null,
                        totalPendingOrders: { $sum: '$quantity' }
                    }
                }
            ]).toArray()

            var allCartcancelledOrders = await db.get().collection(collection.orders).aggregate([
                {
                    $match: { mode: 'cartorder' }
                }, {
                    $unwind: '$products'
                }, {
                    $match: { 'products.status': 'cancel' }
                }, {
                    $project: {
                        quantity: '$products.quantity'
                    }
                }, {
                    $group: {
                        _id: null,
                        totalPendingOrders: { $sum: '$quantity' }
                    }
                }
            ]).toArray()

            if (allCartpendingOrders[0]) {
                allCartpendingOrders = allCartpendingOrders[0].totalPendingOrders
            } else {
                allCartpendingOrders = 0
            } if (allCartplacedOrders[0]) {
                allCartplacedOrders = allCartplacedOrders[0].totalPendingOrders
            } else {
                allCartplacedOrders = 0
            } if (allCartshippedOrders[0]) {
                allCartshippedOrders = allCartshippedOrders[0].totalPendingOrders
            } else {
                allCartshippedOrders = 0
            } if (allCartdeliveredOrders[0]) {
                allCartdeliveredOrders = allCartdeliveredOrders[0].totalPendingOrders
            } else {
                allCartdeliveredOrders = 0
            } if (allCartcancelledOrders[0]) {
                allCartcancelledOrders = allCartcancelledOrders[0].totalPendingOrders
            } else {
                allCartcancelledOrders = 0
            }

            allPendingOrders = parseInt(allBuyNowPendingOrders + allCartpendingOrders)
            allPlacedOrders = parseInt(allBuyNowplacedOrders + allCartplacedOrders)
            allShippedOrders = parseInt(allBuyNowshippedOrders + allCartshippedOrders)
            allDeliveredOrders = parseInt(allBuyNowdeliveredOrders + allCartdeliveredOrders)
            allCancelledOrders = parseInt(allCartcancelledOrders + allBuyNowcancelOrders)

            allOrders = allPendingOrders + allPlacedOrders + allShippedOrders + allDeliveredOrders


           

            resolve({ allPendingOrders, allPlacedOrders, allShippedOrders, allDeliveredOrders, allCancelledOrders, allOrders, totalOrdersToday})
        })
    },
    // TO add a product
    addProduct: (productData) => {
        let productData1 = {
            productname: productData.productname,
            productcode: productData.productcode,
            productcategory: productData.productcategory,
            productsubcategory: productData.productsubcategory,
            productbrand: productData.productbrand,
            suitablebikebrand: productData.suitablebikebrand,
            suitablebikemodel: productData.suitablebikemodel,
            productprice: parseInt(productData.productprice),
            productofferprice: parseInt(productData.productofferprice),
            productquantity: parseInt(productData.productquantity),
            productdate: productData.productdate,
            productdes: productData.productdes,
            status: productData.status,
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collection.newproducts).insertOne(productData1).then(async (data) => {
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
            db.get().collection(collection.newproducts).updateOne({ _id: objectId(productId) }, { $set: { productname: data.productname, productcode: data.productcode, productcategory: data.productcategory, productsubcategory: data.productsubcategory, productbrand: data.productbrand, suitablebikebrand: data.suitablebikebrand, suitablebikemodel: data.suitablebikemodel, productprice: parseInt(data.productprice), productofferprice: parseInt(data.productofferprice), productquantity: parseInt(data.productquantity), productdate: data.productdate, productdes: data.productdes, status: data.status } }).then((result) => {
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
    updateOrderStatusofbuynow: (orderId, userId, orderStatus, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.orders).updateOne({ _id: objectId(orderId) }, { $set: { status: orderStatus } }).then((response) => {
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

    },
    getBuyNowOrders: (userId, orderId) => {
        return new Promise(async (resolve, reject) => {
            var orders = await db.get().collection(collection.orders).find({ _id: objectId(orderId) }).toArray()
            resolve(orders)
        })
    },
    addNewMainCat: (catDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.productCat).insertOne(catDetails).then((response) => {
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

        return new Promise((resolve, reject) => {
            db.get().collection(collection.bikeBrands).deleteOne({ _id: objectId(id) }).then((result) => {

                resolve();
            })
        })

    },
    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            var coupons = await db.get().collection(collection.coupon).find().toArray()
            resolve(coupons)
        })
    },
    addCoupon: (coupon) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.coupon).insertOne({ couponcode: coupon.couponcode, coupondiscount: parseInt(coupon.coupondiscount), coupondate: new Date().toISOString().slice(0, 10) }).then((response) => {
                resolve(response)
            })
        })

    },
    getCouponToEdit: (couponId) => {
        return new Promise(async (resolve, reject) => {
            coupon = await db.get().collection(collection.coupon).findOne({ _id: objectId(couponId) })
            resolve(coupon)
        })
    },
    editCoupon: (couponDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.coupon).updateOne({ _id: objectId(couponDetails.couponId) }, { $set: { couponcode: couponDetails.couponcode, coupondiscount: parseInt(couponDetails.coupondiscount), coupondate: new Date().toISOString().slice(0, 10) } }).then((response) => {
                resolve()
            })
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.coupon).deleteOne({ _id: objectId(couponId) }).then((response) => {
                resolve()
            })
        })
    },
}