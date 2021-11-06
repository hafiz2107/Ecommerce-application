const { response } = require("express")
const { DeactivationsList } = require("twilio/lib/rest/messaging/v1/deactivation")

function addToCart(proId, proPrice, proName) {
    $.ajax({
        url: ' /add-to-cart/' + proId + '/' + proPrice + '/' + proName,
        method: 'get',
        success: (response) => {
            if (response.status) {

                let count = $('#cartCount').html()
                count = parseInt(count) + 1
                $('#cartCount').html(count)
            }
            location.reload();

        }
    })
}

function updateDiv() {
    $("#total").load(window.location.href + " #total");
}

function changeQuantity(proQty, cart_id, pro_id, count, price, totalprice, userId) {
 
    let quantity = parseInt(document.getElementById(pro_id).value)
    if (count == 1 && quantity == 8) {
        limitReachedInCart(quantity)
    } else {

        if (count == 1) {
            if (proQty - 1 >= quantity) {
                price = parseInt(price)
                totalprice = parseInt(totalprice)

                id = pro_id + '1'
                $.ajax({
                    url: '/change-product-quantity',
                    data: {
                        cart: cart_id,
                        product_id: pro_id,
                        count: count,
                        quantity: quantity,
                        price: price,
                        totalprice: price
                    },

                    method: 'POST',
                    success: (response) => {

                        if (response.removeProduct) {
                            location.reload()
                        }
                        else {
                            // Response. total
                            response.quantity = parseInt(response.quantity)
                            response.count = parseInt(response.count)
                            quantity = document.getElementById(pro_id).value = quantity + count;
                            document.getElementById(id).innerHTML = quantity * price;
                            document.getElementById('total').innerHTML = response.total
                            updateDiv()
                        }
                    }
                })
            } else {
                limitReachedInCart(quantity)
            }
        } else {
            if (quantity != 1) {
               
                price = parseInt(price)
                totalprice = parseInt(totalprice)

                id = pro_id + '1'
                $.ajax({
                    url: '/change-product-quantity',
                    data: {
                        cart: cart_id,
                        product_id: pro_id,
                        count: count,
                        quantity: quantity,
                        price: price,
                        totalprice: price
                    },

                    method: 'POST',
                    success: (response) => {

                        if (response.removeProduct) {
                            location.reload()
                        }
                        else {
                            response.quantity = parseInt(response.quantity)
                            response.count = parseInt(response.count)
                            quantity = document.getElementById(pro_id).value = quantity + count;
                            document.getElementById(id).innerHTML = quantity * price;
                            document.getElementById('total').innerHTML = response.total
                            updateDiv()
                        }
                    }
                })
            } else {
                limitOneInCart()
            }

        }
    }

}

function deleteCartItem(cart_id, pro_id) {
    $.ajax({
        url: '/delete-cart-product',
        data: {
            cart: cart_id,
            product_id: pro_id,
        },
        method: 'POST',
        success: (response) => {
            if (response) {
                location.reload()
            }
        }
    })
}
