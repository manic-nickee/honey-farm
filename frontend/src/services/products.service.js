import apiClient from './apiClient'

class ProductsService {
  async getProducts() {
    const { data } = await apiClient.get('/api/products/')
    return data
  }

  async getProduct(productId) {
    const { data } = await apiClient.get(`/api/products/${productId}/`)
    return data
  }
}

const productsService = new ProductsService()
export default productsService