import { ArrowUpRight, Boxes, PackageCheck, TriangleAlert } from 'lucide-react'
import { useProductList } from '../hooks/useProducts'
import './admin.css'

function money(value) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function Admin() {
  const { products, loading, error } = useProductList()
  const stockCount = products.reduce((total, product) => total + Number(product.stock), 0)
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= 5)
  const adminUrl = `${(import.meta.env.VITE_API)}/admin/`

  return (
    <main className="narrow-page admin-page">
      <p className="eyebrow">HONEY FARM / OPERATIONS</p>
      <div className="admin-heading">
        <div><h1>Admin overview</h1><p>Current storefront inventory at a glance.</p></div>
        <a className="primary-button" href={adminUrl}>Open Django admin <ArrowUpRight size={17} /></a>
      </div>
      {loading ? <p>Loading inventory...</p> : error ? <p role="alert">{error}</p> : <><div className="admin-stats">
        <article><Boxes size={20} /><span>Live listings</span><strong>{products.length}</strong></article>
        <article><PackageCheck size={20} /><span>Jars in stock</span><strong>{stockCount}</strong></article>
        <article><TriangleAlert size={20} /><span>Low stock</span><strong>{lowStockProducts.length}</strong></article>
      </div>
      <section className="admin-inventory">
        <div className="admin-section-heading"><h2>Inventory watch</h2><span>5 jars or fewer</span></div>
        {lowStockProducts.length ? lowStockProducts.map((product) => (
          <div className="admin-inventory-row" key={product.id}>
            <div><strong>{product.name}</strong><span>{money(product.price)} per jar</span></div>
            <span className="admin-stock">{product.stock} left</span>
          </div>
        )) : <p className="admin-clear">No low-stock listings right now.</p>}
        <p className="admin-note">Product edits and order management are handled in Django admin, which requires an administrator account.</p>
      </section></>}
    </main>
  )
}