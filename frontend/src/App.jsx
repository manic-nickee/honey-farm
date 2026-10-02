import { useEffect, useState } from 'react'
import { ArrowRight, ShoppingBasket, UserRound, X } from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Home, { HomeNavigation } from './pages/Home'
import Orders from './pages/Orders'
import Product from './pages/Product'
import Products from './pages/Products'
import authService from './services/auth.service'
import cartService from './services/cart.service'
import usersService from './services/users.service'
import './router.css'

export default function App() {
  const [cart, setCart] = useState(cartService.getCart)
  const [user, setUser] = useState(null)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    usersService.getCurrentUser()
      .then((userData) => setUser(userData.authenticated ? userData : null))
      .catch((error) => setNotice(error.message))
  }, [])

  useEffect(() => {
    cartService.saveCart(cart)
  }, [cart])

  useEffect(() => {
    if (location.pathname === '/' && location.hash === '#story') {
      document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.pathname, location.hash])

  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)

  function go(path) {
    setNotice('')
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addToCart(product) {
    setCart((current) => cartService.addItem(current, product))
    setNotice(`${product.name} added to your basket.`)
  }

  function updateQuantity(product, quantity) {
    setCart((current) => cartService.setItemQuantity(current, product, quantity))
  }

  function loadOrders() {
    go('/orders')
  }

  async function logout() {
    try {
      await authService.logout()
      setUser(null)
      go('/')
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/"><span className="brand-mark">H</span><span>Honey Farm<small>FIELD TO JAR</small></span></Link>
        <HomeNavigation user={user} onOrders={loadOrders} />
        <div className="header-actions">
          {user ? <button className="user-button" onClick={loadOrders}><UserRound size={17} /> {user.username}</button> : <button className="user-button" onClick={() => go('/login')}><UserRound size={17} /> Sign in</button>}
          <button className="basket-button" onClick={() => go('/cart')} aria-label={`Basket with ${cartCount} items`}><ShoppingBasket size={19} /><span>{cartCount}</span></button>
        </div>
      </header>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16} /></button></div>}

      <Routes>
        <Route path="/" element={<Home onSelect={(product) => go(`/products/${product.id}`)} onAdd={addToCart} />} />
        <Route path="/products" element={<Products onSelect={(product) => go(`/products/${product.id}`)} onAdd={addToCart} />} />
        <Route path="/products/:id" element={<Product onAdd={addToCart} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/cart" element={<Cart cart={cart} onChange={updateQuantity} onShop={() => go('/products')} onCheckout={() => go(user ? '/checkout' : '/login')} />} />
        <Route path="/login" element={<Auth mode="login" setMode={() => go('/register')} onSuccess={(nextUser) => { setUser(nextUser); go('/checkout') }} />} />
        <Route path="/register" element={<Auth mode="register" setMode={() => go('/login')} onSuccess={(nextUser) => { setUser(nextUser); go('/checkout') }} />} />
        <Route path="/checkout" element={user ? <Checkout cart={cart} onDone={(order) => { setCart({}); setNotice(`Order #${order.id} is confirmed. Thank you.`); go('/orders') }} /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={user ? <Orders user={user} onBack={() => go('/products')} onLogout={logout} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound onHome={() => go('/')} />} />
      </Routes>
    </div>
  )
}

function NotFound({ onHome }) {
  return <main className="narrow-page"><p className="eyebrow">NOT FOUND</p><h1>This page has wandered off.</h1><button className="primary-button" onClick={onHome}>Back to the shop <ArrowRight size={17} /></button></main>
}
