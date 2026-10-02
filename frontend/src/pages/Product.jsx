import { ChevronLeft, ShoppingBasket } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import ProductVisual from '../components/product/ProductVisual'
import { useProductsByIds } from '../hooks/useProducts'
import { money } from '../utils'

export default function Product({ onAdd }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, loading, error } = useProductsByIds([id])
  const product = products.find((item) => item.id === Number(id))

  if (loading) return <main className="narrow-page"><p>Loading this jar...</p></main>
  if (error) return <main className="narrow-page"><p role="alert">{error}</p><button className="primary-button" onClick={() => navigate('/products')}>Browse all honey</button></main>
  if (!product) {
    return <main className="narrow-page"><p className="eyebrow">NOT FOUND</p><h1>That jar isn't available.</h1><button className="primary-button" onClick={() => navigate('/products')}>Browse all honey</button></main>
  }

  return <main className="detail-page"><button className="back-button" onClick={() => navigate('/products')}><ChevronLeft size={17} /> Back to the harvest</button><div className="detail-layout"><ProductVisual product={product} large /><div className="detail-copy"><p className="eyebrow">RAW HONEY / SMALL BATCH</p><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-description">{product.description}</p><p className="stock-note">{product.stock} jars currently available</p><button className="primary-button" onClick={() => onAdd(product)} disabled={product.stock < 1}>{product.stock < 1 ? 'Out of stock' : 'Add to basket'} <ShoppingBasket size={18} /></button></div></div></main>
}