import { useState } from 'react'
import { ArrowRight, Plus, Search } from 'lucide-react'
import ProductVisual from '../components/product/ProductVisual'
import { useProductList } from '../hooks/useProducts'
import './products.css'
import { money } from '../utils'

export default function Products({ onSelect, onAdd }) {
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const { products: allProducts, loading, error } = useProductList()
  const filteredProducts = allProducts.filter((product) => product.available).filter((product) => {
    const matchesQuery = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (stockFilter === 'all' || product.stock > 0)
  })

  return (
    <main className="product-section products-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM OUR HIVES</p>
          <h1>All the honey</h1>
        </div>
        <p>Small-batch jars shaped by the flowers, fields, and weather of each season.</p>
      </div>
      <div className="products-toolbar">
        <label className="products-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search honey"
            aria-label="Search products"
          />
        </label>
        <div className="products-filter" aria-label="Filter products">
          <button className={stockFilter === 'all' ? 'active' : ''} onClick={() => setStockFilter('all')}>All jars</button>
          <button className={stockFilter === 'available' ? 'active' : ''} onClick={() => setStockFilter('available')}>In stock</button>
        </div>
      </div>
      {loading ? <div className="empty-state">Loading honey...</div> : error ? <div className="empty-state" role="alert">{error}</div> : filteredProducts.length ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <button className="product-image-button" onClick={() => onSelect(product)}>
                <ProductVisual product={product} />
              </button>
              <div className="product-card-copy">
                <div><p className="product-kicker">RAW HONEY</p><h2>{product.name}</h2></div>
                <strong>{money(product.price)}</strong>
                <p>{product.description}</p>
                <button className="text-button" onClick={() => onAdd(product)} disabled={product.stock < 1}>
                  {product.stock < 1 ? 'Out of stock' : 'Add to basket'} {product.stock > 0 && <Plus size={16} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No jars match that search.</p>
          <button className="text-button" onClick={() => { setQuery(''); setStockFilter('all') }}>Clear filters <ArrowRight size={16} /></button>
        </div>
      )}
    </main>
  )
}