const { response } = require("express")

function addToCart(proId,proPrice) {
    $.ajax({
        url: ' /add-to-cart/'+proId+'/'+proPrice,
        method: 'get',
        success: (response) => {
            if(response.status){
                let count = $('#cartCount').html()
                count=parseInt(count)+1
                $('#cartCount').html(count)
            }
           
        }
    })
}

    function changeQuantity(cart_id,pro_id,count,price,totalprice)   {
        
        let quantity = parseInt(document.getElementById(pro_id).value)
        price = parseInt(price)
        totalprice = parseInt(totalprice)
        
          $.ajax({
        url : '/change-product-quantity',
    data:{
        cart : cart_id,
        product_id : pro_id,
        count : count,
        quantity:quantity,
        price:price,
        totalprice:price    
    },
         
    method : 'POST',
        success : (response)=>{
            
            if(response.removeProduct){
                location.reload()
            }
            else{
                
                response.quantity = parseInt(response.quantity)
                response.count = parseInt(response.count)
                let total = document.getElementById(pro_id).value = quantity+count
                
                let a = total * price
                console.log(a);
                document.getElementById(totalPrice).innerHTML = location.reload()
            }
        }
          })
}

function deleteCartItem(cart_id , pro_id){
    $.ajax({
        url: '/delete-cart-product',
        data:{
            cart: cart_id,
            product_id: pro_id,
        },
        method: 'POST',
        success:(response)=>{
            if(response){
                location.reload()
            }
        }
    })
}
