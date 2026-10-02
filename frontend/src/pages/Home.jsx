import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductVisual from '../components/product/ProductVisual'
import { useProductList } from '../hooks/useProducts'
import { money } from '../utils'

export function HomeNavigation({ user, onOrders }) {
  return <nav className="main-nav" aria-label="Main navigation">
    <Link to="/">Shop</Link>
    <Link to="/products">Products</Link>
    <Link to="/admin">Admin</Link>
    <Link to="/#story">Our story</Link>
    {user && <button onClick={onOrders}>Orders</button>}
  </nav>
}

export default function Home({ onSelect, onAdd }) {
  const { products: allProducts, loading, error } = useProductList()
  const products = allProducts.filter((product) => product.available)

  return <>
    <main>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">PURE / PATIENTLY MADE / LOCAL</p><h1>Sweetness with a sense of place.</h1><p>Small-batch honey gathered from healthy hives and bottled close to home.</p><button className="primary-button" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>Explore the harvest <ArrowRight size={18} /></button></div><div className="hero-jar"><div className="sun-disc" /><div className="jar-label">RAW<br /><strong>HONEY</strong><small>HONEY FARM / 2026</small></div></div></section>
      <section className="product-section" id="products"><div className="section-heading"><div><p className="eyebrow">FROM OUR HIVES</p><h2>This season's jars</h2></div><p>Every jar carries the character of the flowers, fields, and weather that shaped it.</p></div>{loading ? <p className="empty-state">Loading this season's jars...</p> : error ? <p className="empty-state" role="alert">{error}</p> : <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><button className="product-image-button" onClick={() => onSelect(product)}><ProductVisual product={product} /></button><div className="product-card-copy"><div><p className="product-kicker">RAW HONEY</p><h3>{product.name}</h3></div><strong>{money(product.price)}</strong><p>{product.description}</p><button className="text-button" onClick={() => onAdd(product)}>Add to basket <Plus size={16} /></button></div></article>)}</div>}</section>
      <section className="story-section" id="story"><div><p className="eyebrow">A SLOWER KIND OF SWEET</p><h2>From flowering field to breakfast table.</h2></div><p>We work with the seasons, never rushing the bees or the honey. The result is a clear, fragrant jar with the landscape still in it.</p></section>
    </main><footer><span>Honey Farm</span><span>Field to jar, with care.</span><span>© 2026</span></footer>
  </>
}