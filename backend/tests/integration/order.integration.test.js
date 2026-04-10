const request = require('supertest');
const { app } = require('./setup');
const Order = require('../../src/models/Order');
const Cart = require('../../src/models/Cart');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

describe('Order API Integration Tests', () => {
  let userToken;
  let userId;
  let productId;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@1234',
      role: 'beneficiary',
      location: 'Colombo'
    });
    userId = user._id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'Test@1234'
      });

    userToken = loginResponse.body.token;

    // Create test product
    const product = await Product.create({
      name: 'Sanitary Pad',
      category: 'Hygiene',
      price: 5.99,
      stockQty: 100
    });
    productId = product._id;
  });

  describe('POST /api/orders/checkout', () => {
    it('should create order from cart', async () => {
      // Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      // Checkout
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toHaveProperty('_id');
      expect(response.body.order.items).toHaveLength(1);
      expect(response.body.order.total).toBe(5.99 * 2);
      expect(response.body.order.orderStatus).toBe('PENDING');

      // Verify order in database
      const order = await Order.findOne({ userId: userId.toString() });
      expect(order).toBeTruthy();
      expect(order.items).toHaveLength(1);
    });

    it('should fail to checkout with empty cart', async () => {
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart is empty');
    });

    it('should checkout as guest', async () => {
      const guestId = 'guest-order';
      
      // Add item to guest cart
      await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      // Checkout as guest
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('x-guest-id', guestId)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order.userId).toBe(guestId);
    });
  });

  describe('PATCH /api/orders/:orderId/contact', () => {
    let orderId;

    beforeEach(async () => {
      // Create order
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      orderId = checkoutResponse.body.order._id;
    });

    it('should update order contact info', async () => {
      const contactInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      const response = await request(app)
        .patch(`/api/orders/${orderId}/contact`)
        .set('Authorization', userToken)
        .send(contactInfo)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order.contactInfo.firstName).toBe(contactInfo.firstName);
      expect(response.body.order.contactInfo.email).toBe(contactInfo.email);

      // Verify in database
      const order = await Order.findById(orderId);
      expect(order.contactInfo.email).toBe(contactInfo.email);
    });

    it('should fail to update non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/orders/${nonExistentId}/contact`)
        .set('Authorization', userToken)
        .send({ email: 'test@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order not found');
    });
  });

  describe('POST /api/orders/:orderId/pay', () => {
    let orderId;

    beforeEach(async () => {
      // Create order
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      orderId = checkoutResponse.body.order._id;

      // Update contact info
      await request(app)
        .patch(`/api/orders/${orderId}/contact`)
        .set('Authorization', userToken)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        });
    });

    it('should pay order successfully', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Payment successful');
      expect(response.body.order.orderStatus).toBe('PAID');
      expect(response.body.order.payment.status).toBe('PAID');

      // Verify stock was reduced
      const product = await Product.findById(productId);
      expect(product.stockQty).toBe(98); // 100 - 2

      // Verify cart was closed
      const cart = await Cart.findOne({ userId: userId.toString(), status: 'ACTIVE' });
      expect(cart).toBeNull();
    });

    it('should fail to pay without contact email', async () => {
      // Create new order without contact info
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      const newOrderId = checkoutResponse.body.order._id;

      const response = await request(app)
        .post(`/api/orders/${newOrderId}/pay`)
        .set('Authorization', userToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contact email is required');
    });

    it('should fail to pay already paid order', async () => {
      // Pay order first time
      await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', userToken);

      // Try to pay again
      const response = await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', userToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Already paid');
    });

    it('should fail to pay with insufficient stock', async () => {
      // Create new order
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      const newOrderId = checkoutResponse.body.order._id;

      // Update contact info
      await request(app)
        .patch(`/api/orders/${newOrderId}/contact`)
        .set('Authorization', userToken)
        .send({ email: 'test@example.com' });

      // Reduce stock to 0
      await Product.findByIdAndUpdate(productId, { stockQty: 0 });

      const response = await request(app)
        .post(`/api/orders/${newOrderId}/pay`)
        .set('Authorization', userToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not enough stock');
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(async () => {
      // Create multiple orders
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);
    });

    it('should get all user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should get guest orders', async () => {
      const guestId = 'guest-orders';
      
      await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      await request(app)
        .post('/api/orders/checkout')
        .set('x-guest-id', guestId);

      const response = await request(app)
        .get('/api/orders')
        .set('x-guest-id', guestId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(1);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    let orderId;

    beforeEach(async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      orderId = checkoutResponse.body.order._id;
    });

    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toHaveProperty('_id');
      expect(response.body.order._id).toBe(orderId);
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .get('/api/orders/invalidid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid product id');
    });

    it('should fail with non-existent order ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/orders/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('PUT /api/orders/:orderId', () => {
    let orderId;

    beforeEach(async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      orderId = checkoutResponse.body.order._id;
    });

    it('should update order', async () => {
      const response = await request(app)
        .put(`/api/orders/${orderId}`)
        .set('Authorization', userToken)
        .send({ orderStatus: 'PAID' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.order.orderStatus).toBe('PAID');
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .put('/api/orders/invalidid')
        .set('Authorization', userToken)
        .send({ orderStatus: 'PAID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid product id');
    });
  });

  describe('DELETE /api/orders/:orderId', () => {
    let orderId;

    beforeEach(async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken);

      orderId = checkoutResponse.body.order._id;
    });

    it('should delete order', async () => {
      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const order = await Order.findById(orderId);
      expect(order).toBeNull();
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .delete('/api/orders/invalidid')
        .set('Authorization', userToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid product id');
    });
  });

  describe('Order Integration Flow', () => {
    it('should complete full order flow: add to cart -> checkout -> update contact -> pay', async () => {
      // Step 1: Add to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 3
        })
        .expect(201);

      // Step 2: Checkout
      const checkoutResponse = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', userToken)
        .expect(201);

      const orderId = checkoutResponse.body.order._id;
      expect(checkoutResponse.body.order.total).toBe(5.99 * 3);

      // Step 3: Update contact
      const contactResponse = await request(app)
        .patch(`/api/orders/${orderId}/contact`)
        .set('Authorization', userToken)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '9876543210'
        })
        .expect(200);

      expect(contactResponse.body.order.contactInfo.email).toBe('jane@example.com');

      // Step 4: Pay
      const payResponse = await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', userToken)
        .expect(200);

      expect(payResponse.body.order.orderStatus).toBe('PAID');
      expect(payResponse.body.order.payment.status).toBe('PAID');

      // Verify stock reduction
      const product = await Product.findById(productId);
      expect(product.stockQty).toBe(97); // 100 - 3
    });
  });
});
