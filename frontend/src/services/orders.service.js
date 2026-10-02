import apiClient from './apiClient'

class OrdersService {
  async getOrders() {
    const { data } = await apiClient.get('/api/orders/')
    return data
  }

  async createOrder(order) {
    const headers = await apiClient.getCsrfHeaders()
    const { data } = await apiClient.post('/api/orders/', order, { headers })
    return data
  }
}

const ordersService = new OrdersService()
export default ordersService