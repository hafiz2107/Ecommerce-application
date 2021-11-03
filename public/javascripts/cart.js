const { response } = require("express")
const { DeactivationsList } = require("twilio/lib/rest/messaging/v1/deactivation")

function addToCart(proId, proPrice, proName) {
    $.ajax({
        url: ' /add-to-cart/'+proId+'/'+proPrice+'/'+proName,
        method: 'get',
        success: (response) => {
            if(response.status){
              
                let count = $('#cartCount').html()
                count=parseInt(count)+1
                $('#cartCount').html(count)
            }
            location.reload();   
           
        }
    })
}

    function changeQuantity(cart_id,pro_id,count,price,totalprice,userId)   {
        
        let quantity = parseInt(document.getElementById(pro_id).value)
        price = parseInt(price)
        totalprice = parseInt(totalprice)
        
        id = pro_id+'1'
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
                quantity = document.getElementById(pro_id).value = quantity+count;
                document.getElementById(id).innerHTML = quantity*price;
                document.getElementById('total').innerHTML = response.total
                location.reload()
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
