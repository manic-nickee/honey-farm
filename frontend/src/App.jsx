import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, Minus, Plus, ShoppingBasket, UserRound, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const CART_KEY = 'honey-farm-cart'

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.error || Object.values(data).flat().join(' ') || 'Something went wrong.'
    throw new Error(detail)
  }
  return data
}

function money(value) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function ProductVisual({ product, large = false }) {
  return product.image ? (
    <img className={large ? 'product-visual large' : 'product-visual'} src={product.image} alt={product.name} />
  ) : (
    <div className={large ? 'product-visual large honey-placeholder' : 'product-visual honey-placeholder'} aria-label={product.name}>
      <span>H</span>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem(CART_KEY) || '{}'))
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api('/api/products/'), api('/api/auth/user/')])
      .then(([productData, userData]) => {
        setProducts(productData.filter((product) => product.available))
        setUser(userData.authenticated ? userData : null)
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const cartItems = useMemo(() => Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === Number(id)), quantity }))
    .filter((item) => item.product), [cart, products])
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0)

  function show(viewName) {
    setNotice('')
    setView(viewName)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addToCart(product) {
    setCart((current) => ({ ...current, [product.id]: Math.min((current[product.id] || 0) + 1, product.stock) }))
    setNotice(`${product.name} added to your basket.`)
  }

  function updateQuantity(product, quantity) {
    setCart((current) => {
      const next = { ...current }
      if (quantity <= 0) delete next[product.id]
      else next[product.id] = Math.min(quantity, product.stock)
      return next
    })
  }

  async function loadOrders() {
    try {
      setOrders(await api('/api/orders/'))
      show('orders')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function logout() {
    try {
      await api('/api/auth/csrf/')
      const csrf = getCookie('csrftoken')
      await api('/api/auth/logout/', { method: 'POST', headers: { 'X-CSRFToken': csrf } })
      setUser(null)
      show('home')
    } catch (error) {
      setNotice(error.message)
    }
  }

  if (loading) return <div className="loading-screen">Loading the harvest<span>...</span></div>

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => show('home')}><span className="brand-mark">H</span><span>Honey Farm<small>FIELD TO JAR</small></span></button>
        <nav className="main-nav" aria-label="Main navigation">
          <button onClick={() => show('home')}>Shop</button>
          <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>Our story</button>
          {user && <button onClick={loadOrders}>Orders</button>}
        </nav>
        <div className="header-actions">
          {user ? <button className="user-button" onClick={loadOrders}><UserRound size={17} /> {user.username}</button> : <button className="user-button" onClick={() => show('auth')}><UserRound size={17} /> Sign in</button>}
          <button className="basket-button" onClick={() => show('cart')} aria-label={`Basket with ${cartCount} items`}><ShoppingBasket size={19} /><span>{cartCount}</span></button>
        </div>
      </header>

      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16} /></button></div>}

      {view === 'home' && <Home products={products} onSelect={(product) => { setSelectedProduct(product); show('detail') }} onAdd={addToCart} />}
      {view === 'detail' && selectedProduct && <Detail product={selectedProduct} onBack={() => show('home')} onAdd={addToCart} />}
      {view === 'cart' && <Cart items={cartItems} total={cartTotal} onChange={updateQuantity} onShop={() => show('home')} onCheckout={() => user ? show('checkout') : show('auth')} />}
      {view === 'auth' && <Auth mode={authMode} setMode={setAuthMode} onSuccess={(nextUser) => { setUser(nextUser); show('checkout') }} />}
      {view === 'checkout' && <Checkout items={cartItems} total={cartTotal} user={user} onDone={(order) => { setCart({}); setNotice(`Order #${order.id} is confirmed. Thank you.`); show('orders'); loadOrders() }} />}
      {view === 'orders' && <Orders orders={orders} user={user} onBack={() => show('home')} onLogout={logout} />}
    </div>
  )
}

function Home({ products, onSelect, onAdd }) {
  return <>
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">PURE / PATIENTLY MADE / LOCAL</p><h1>Sweetness with a sense of place.</h1><p>Small-batch honey gathered from healthy hives and bottled close to home.</p><button className="primary-button" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>Explore the harvest <ArrowRight size={18} /></button></div><div className="hero-jar"><div className="sun-disc" /><div className="jar-label">RAW<br /><strong>HONEY</strong><small>HONEY FARM / 2026</small></div></div></section>
      <section className="product-section" id="products"><div className="section-heading"><div><p className="eyebrow">FROM OUR HIVES</p><h2>This season's jars</h2></div><p>Every jar carries the character of the flowers, fields, and weather that shaped it.</p></div><div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><button className="product-image-button" onClick={() => onSelect(product)}><ProductVisual product={product} /></button><div className="product-card-copy"><div><p className="product-kicker">RAW HONEY</p><h3>{product.name}</h3></div><strong>{money(product.price)}</strong><p>{product.description}</p><button className="text-button" onClick={() => onAdd(product)}>Add to basket <Plus size={16} /></button></div></article>)}</div></section>
      <section className="story-section" id="story"><div><p className="eyebrow">A SLOWER KIND OF SWEET</p><h2>From flowering field to breakfast table.</h2></div><p>We work with the seasons, never rushing the bees or the honey. The result is a clear, fragrant jar with the landscape still in it.</p></section>
    </main><footer><span>Honey Farm</span><span>Field to jar, with care.</span><span>© 2026</span></footer>
  </>
}

function Detail({ product, onBack, onAdd }) {
  return <main className="detail-page"><button className="back-button" onClick={onBack}><ChevronLeft size={17} /> Back to the harvest</button><div className="detail-layout"><ProductVisual product={product} large /><div className="detail-copy"><p className="eyebrow">RAW HONEY / SMALL BATCH</p><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-description">{product.description}</p><p className="stock-note">{product.stock} jars currently available</p><button className="primary-button" onClick={() => onAdd(product)}>Add to basket <ShoppingBasket size={18} /></button></div></div></main>
}

function Cart({ items, total, onChange, onShop, onCheckout }) {
  return <main className="narrow-page"><p className="eyebrow">YOUR SELECTION</p><h1>Your basket</h1>{items.length === 0 ? <div className="empty-state"><p>Your basket is waiting for something sweet.</p><button className="primary-button" onClick={onShop}>Browse honey <ArrowRight size={17} /></button></div> : <div className="cart-layout"><div>{items.map(({ product, quantity }) => <div className="cart-row" key={product.id}><ProductVisual product={product} /><div className="cart-product"><h3>{product.name}</h3><p>{money(product.price)} per jar</p></div><div className="quantity-control"><button onClick={() => onChange(product, quantity - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => onChange(product, quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><strong>{money(Number(product.price) * quantity)}</strong></div>)}</div><aside className="summary"><p className="eyebrow">ORDER TOTAL</p><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Shipping and taxes are calculated at checkout.</small><button className="primary-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={17} /></button></aside></div>}</main>
}

function Auth({ mode, setMode, onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); setError(''); try { await api('/api/auth/csrf/'); const csrf = getCookie('csrftoken'); if (mode === 'register') await api('/api/auth/register/', { method: 'POST', headers: { 'X-CSRFToken': csrf }, body: JSON.stringify(form) }); const result = await api('/api/auth/login/', { method: 'POST', headers: { 'X-CSRFToken': csrf }, body: JSON.stringify(form) }); onSuccess(result) } catch (requestError) { setError(requestError.message) } }
  return <main className="narrow-page auth-page"><p className="eyebrow">WELCOME TO THE FARM</p><h1>{mode === 'login' ? 'Come on in.' : 'Start your jar list.'}</h1><form className="form-panel" onSubmit={submit}>{error && <p className="form-error">{error}</p>}<label>Username<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label><label>Password<input required type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button className="primary-button" type="submit">{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><button className="text-button centered" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}</button></main>
}

function Checkout({ items, total, onDone }) {
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' }); const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); setError(''); try { await api('/api/auth/csrf/'); const csrf = getCookie('csrftoken'); const order = await api('/api/orders/', { method: 'POST', headers: { 'X-CSRFToken': csrf }, body: JSON.stringify({ ...form, items: items.map(({ product, quantity }) => ({ product: product.id, quantity })) }) }); onDone(order) } catch (requestError) { setError(requestError.message) } }
  return <main className="narrow-page checkout-page"><p className="eyebrow">ALMOST YOURS</p><h1>Make it yours.</h1><div className="checkout-layout"><form className="form-panel" onSubmit={submit}>{error && <p className="form-error">{error}</p>}<label>Your name<input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label><label>Mobile number<input required inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>Delivery address<textarea required rows="4" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><button className="primary-button" type="submit">Place order <ArrowRight size={17} /></button></form><aside className="summary"><p className="eyebrow">YOUR JARS</p>{items.map(({ product, quantity }) => <div className="mini-line" key={product.id}><span>{product.name} × {quantity}</span><strong>{money(Number(product.price) * quantity)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside></div></main>
}

function Orders({ orders, user, onBack, onLogout }) {
  return <main className="narrow-page"><div className="orders-heading"><div><p className="eyebrow">{user?.username.toUpperCase()}'S JARS</p><h1>Order history</h1></div><button className="text-button" onClick={onLogout}>Sign out</button></div>{orders.length === 0 ? <div className="empty-state"><p>No orders yet. Your first jar is just a few clicks away.</p><button className="primary-button" onClick={onBack}>Browse honey <ArrowRight size={17} /></button></div> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div><p className="product-kicker">ORDER #{order.id}</p><h3>{new Date(order.created_at).toLocaleDateString()}</h3></div><span className="status">{order.status}</span><strong>{money(order.total)}</strong><p>{order.items.map((item) => `${item.product} × ${item.quantity}`).join(' · ')}</p></article>)}</div>}</main>
}

function getCookie(name) { return document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1] || '' }

export default App
