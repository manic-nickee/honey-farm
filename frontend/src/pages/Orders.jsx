import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import ordersService from '../services/orders.service'
import { money } from '../utils'

export default function Orders({ user, onBack, onLogout }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ordersService.getOrders()
      .then((data) => { if (active) setOrders(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <main className="narrow-page"><p>Loading your orders...</p></main>
  if (error) return <main className="narrow-page"><p role="alert">{error}</p></main>

  return <main className="narrow-page"><div className="orders-heading"><div><p className="eyebrow">{user?.username.toUpperCase()}'S JARS</p><h1>Order history</h1></div><button className="text-button" onClick={onLogout}>Sign out</button></div>{orders.length === 0 ? <div className="empty-state"><p>No orders yet. Your first jar is just a few clicks away.</p><button className="primary-button" onClick={onBack}>Browse honey <ArrowRight size={17} /></button></div> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div><p className="product-kicker">ORDER #{order.id}</p><h3>{new Date(order.created_at).toLocaleDateString()}</h3></div><span className="status">{order.status}</span><strong>{money(order.total)}</strong><p>{order.items.map((item) => `${item.product} × ${item.quantity}`).join(' · ')}</p></article>)}</div>}</main>
}