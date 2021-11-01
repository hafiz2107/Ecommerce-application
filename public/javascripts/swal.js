// To delete products from admin's product view
function deleteswal(proId) {
    swal({
        title: "Are you sure you want to delete the product?",
        text: "Once deleted, you will not be able to recover !",
        icon: "error",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
            if (willDelete) {
                location.href = '/admin/remove-product/' + proId
            } 
        });
}

function deleteCartProduct(cartId , proId){
    swal({
        title: "Are you sure you want to delete the product?",
        icon: "error",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
        if (willDelete) {
            deleteCartItem(cartId , proId)
        }
    });
}

function limitReachedInCart(quantity){
    swal({
        title: "Limit Reached !",
        text: `You can only add ${quantity} units of this product in your cart`,
        icon: "error",
        button: "Ok",
    });
}

