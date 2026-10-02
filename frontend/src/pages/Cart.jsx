import { ArrowRight, Minus, Plus } from 'lucide-react'
import { useProductsByIds } from '../hooks/useProducts'
import ProductVisual from '../components/product/ProductVisual'
import { money } from '../utils'

export default function Cart({ cart, onChange, onShop, onCheckout }) {
  const { products, loading, error } = useProductsByIds(Object.keys(cart))
  const items = products.map((product) => ({ product, quantity: cart[product.id] }))
  const total = items.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0)

  return <main className="narrow-page"><p className="eyebrow">YOUR SELECTION</p><h1>Your basket</h1>{loading ? <p>Loading your basket...</p> : error ? <p role="alert">{error}</p> : items.length === 0 ? <div className="empty-state"><p>Your basket is waiting for something sweet.</p><button className="primary-button" onClick={onShop}>Browse honey <ArrowRight size={17} /></button></div> : <div className="cart-layout"><div>{items.map(({ product, quantity }) => <div className="cart-row" key={product.id}><ProductVisual product={product} /><div className="cart-product"><h3>{product.name}</h3><p>{money(product.price)} per jar</p></div><div className="quantity-control"><button onClick={() => onChange(product, quantity - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><span>{quantity}</span><button onClick={() => onChange(product, quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><strong>{money(Number(product.price) * quantity)}</strong></div>)}</div><aside className="summary"><p className="eyebrow">ORDER TOTAL</p><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Shipping and taxes are calculated at checkout.</small><button className="primary-button" onClick={onCheckout}>Continue to checkout <ArrowRight size={17} /></button></aside></div>}</main>
}