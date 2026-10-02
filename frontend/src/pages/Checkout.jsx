import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useProductsByIds } from '../hooks/useProducts'
import ordersService from '../services/orders.service'
import { money } from '../utils'

export default function Checkout({ cart, onDone }) {
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const { products, loading, error: productsError } = useProductsByIds(Object.keys(cart))
  const items = products.map((product) => ({ product, quantity: cart[product.id] }))
  const total = items.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0)

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const order = await ordersService.createOrder({ ...form, items: items.map(({ product, quantity }) => ({ product: product.id, quantity })) })
      onDone(order)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (loading) return <main className="narrow-page"><p>Loading your order...</p></main>
  if (productsError) return <main className="narrow-page"><p role="alert">{productsError}</p></main>

  return <main className="narrow-page checkout-page"><p className="eyebrow">ALMOST YOURS</p><h1>Make it yours.</h1><div className="checkout-layout"><form className="form-panel" onSubmit={submit}>{error && <p className="form-error">{error}</p>}<label>Your name<input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label><label>Mobile number<input required inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>Delivery address<textarea required rows="4" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><button className="primary-button" type="submit">Place order <ArrowRight size={17} /></button></form><aside className="summary"><p className="eyebrow">YOUR JARS</p>{items.map(({ product, quantity }) => <div className="mini-line" key={product.id}><span>{product.name} × {quantity}</span><strong>{money(Number(product.price) * quantity)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside></div></main>
}