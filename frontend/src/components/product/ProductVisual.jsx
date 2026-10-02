export default function ProductVisual({ product, large = false }) {
  return product.image ? (
    <img className={large ? 'product-visual large' : 'product-visual'} src={product.image} alt={product.name} />
  ) : (
    <div className={large ? 'product-visual large honey-placeholder' : 'product-visual honey-placeholder'} aria-label={product.name}>
      <span>H</span>
    </div>
  )
}