const CART_KEY = 'honey-farm-cart'

class CartService {
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '{}')
    } catch {
      return {}
    }
  }

  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }

  addItem(cart, product) {
    if (product.stock < 1) return cart
    return { ...cart, [product.id]: Math.min((cart[product.id] || 0) + 1, product.stock) }
  }

  setItemQuantity(cart, product, quantity) {
    const next = { ...cart }
    if (quantity <= 0) delete next[product.id]
    else next[product.id] = Math.min(quantity, product.stock)
    return next
  }
}

const cartService = new CartService()
export default cartService