import { useEffect, useState } from 'react'
import productsService from '../services/products.service'

export function useProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    productsService.getProducts()
      .then((data) => { if (active) setProducts(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { products, loading, error }
}

export function useProductsByIds(ids) {
  const productIds = [...new Set(ids.map(Number).filter(Number.isFinite))]
  const key = productIds.join(',')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    if (!key) {
      setProducts([])
      setLoading(false)
      return () => { active = false }
    }

    Promise.all(productIds.map((id) => productsService.getProduct(id)))
      .then((data) => { if (active) setProducts(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [key])

  return { products, loading, error }
}