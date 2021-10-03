function addToCart(proId) {
    $.ajax({
        url: ' /add-to-cart/'+proId,
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

    function changeQuantity(cart_id,pro_id,count)   {
        
        let quantity = parseInt(document.getElementById(pro_id).value)
        
          $.ajax({
        url : '/change-product-quantity',
    data:{
        cart : cart_id,
        product_id : pro_id,
        count : count,
        quantity:quantity
    },
         
    method : 'POST',
        success : (response)=>{
            
            if(response.removeProduct){
                location.reload()
            }
            else{
                response.quantity = parseInt(response.quantity)
                response.count = parseInt(response.count)
                document.getElementById(pro_id).value = quantity+count
            }
        }
          })
        }
