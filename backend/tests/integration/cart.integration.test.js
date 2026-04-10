const request = require('supertest');
const { app } = require('./setup');
const Cart = require('../../src/models/Cart');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

describe('Cart API Integration Tests', () => {
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

  describe('POST /api/cart/items', () => {
    it('should add item to cart with user token', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].qty).toBe(2);

      // Verify in database
      const cart = await Cart.findOne({ userId: userId.toString(), status: 'ACTIVE' });
      expect(cart).toBeTruthy();
      expect(cart.items).toHaveLength(1);
    });

    it('should add item to cart as guest', async () => {
      const guestId = 'guest-123';
      const response = await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 1
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify in database
      const cart = await Cart.findOne({ userId: guestId, status: 'ACTIVE' });
      expect(cart).toBeTruthy();
    });

    it('should fail to add item with invalid product ID', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: 'invalidid',
          qty: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail to add item with quantity less than 1', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Qty must be >= 1');
    });

    it('should fail to add item when out of stock', async () => {
      // Update product to have low stock
      await Product.findByIdAndUpdate(productId, { stockQty: 1 });

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Out of stock');
    });

    it('should update quantity when adding same product again', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      // Add same item again
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 3
        })
        .expect(200);

      expect(response.body.cart.items[0].qty).toBe(5);
    });
  });

  describe('GET /api/cart', () => {
    it('should get user cart', async () => {
      // Add item to cart first
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart).toBeTruthy();
      expect(response.body.cart.items).toHaveLength(1);
    });

    it('should create empty cart if none exists', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(0);
    });

    it('should get guest cart', async () => {
      const guestId = 'guest-456';
      
      // Add item as guest
      await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 1
        });

      const response = await request(app)
        .get('/api/cart')
        .set('x-guest-id', guestId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
    });
  });

  describe('GET /api/cart/summary', () => {
    it('should get cart summary with items', async () => {
      // Add items to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', userToken)
        .send({
          productId: productId.toString(),
          qty: 2
        });

      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary).toHaveProperty('subtotal');
      expect(response.body.summary).toHaveProperty('shipping');
      expect(response.body.summary).toHaveProperty('tax');
      expect(response.body.summary).toHaveProperty('total');
      expect(response.body.summary.subtotal).toBe(5.99 * 2);
      expect(response.body.summary.total).toBe(5.99 * 2);
    });

    it('should get empty cart summary', async () => {
      const response = await request(app)
        .get('/api/cart/summary')
        .set('Authorization', userToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary.subtotal).toBe(0);
      expect(response.body.summary.total).toBe(0);
    });
  });

  describe('POST /api/cart/merge', () => {
    let guestId;

    beforeEach(async () => {
      guestId = 'guest-789';
      
      // Add item to guest cart
      await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 2
        });
    });

    it('should merge guest cart into user cart', async () => {
      const response = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', userToken)
        .set('x-guest-id', guestId)
        .send({ guestUserId: guestId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.merged).toBe(true);
      expect(response.body.cart).toBeTruthy();

      // Verify guest cart is cleared
      const guestCart = await Cart.findOne({ userId: guestId, status: 'ACTIVE' });
      expect(guestCart).toBeNull();
    });

    it('should not merge when guest cart is empty', async () => {
      // Clear guest cart
      await Cart.deleteOne({ userId: guestId });

      const response = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', userToken)
        .set('x-guest-id', guestId)
        .send({ guestUserId: guestId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.merged).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/cart/merge')
        .set('x-guest-id', guestId)
        .send({ guestUserId: guestId })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cart/:id', () => {
    let cartId;

    beforeEach(async () => {
      // Create cart
      const cart = await Cart.create({
        userId: userId.toString(),
        items: [{
          productId: productId,
          qty: 2,
          priceAtTime: 5.99
        }],
        status: 'ACTIVE'
      });
      cartId = cart._id;
    });

    it('should get cart by ID', async () => {
      const response = await request(app)
        .get(`/api/cart/${cartId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart).toBeTruthy();
      expect(response.body.cart._id).toBe(cartId.toString());
    });

    it('should fail with invalid cart ID', async () => {
      const response = await request(app)
        .get('/api/cart/invalidid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid cart id');
    });

    it('should fail with non-existent cart ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/cart/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart not found');
    });
  });

  describe('PUT /api/cart/:id', () => {
    let cartId;

    beforeEach(async () => {
      const cart = await Cart.create({
        userId: userId.toString(),
        items: [{
          productId: productId,
          qty: 2,
          priceAtTime: 5.99
        }],
        status: 'ACTIVE'
      });
      cartId = cart._id;
    });

    it('should update cart', async () => {
      const response = await request(app)
        .put(`/api/cart/${cartId}`)
        .send({
          items: [{
            productId: productId.toString(),
            qty: 5,
            priceAtTime: 5.99
          }],
          status: 'ACTIVE'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cart.items[0].qty).toBe(5);
    });

    it('should fail with invalid items array', async () => {
      const response = await request(app)
        .put(`/api/cart/${cartId}`)
        .send({
          items: 'not an array'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('items must be an array');
    });

    it('should fail with invalid product ID in items', async () => {
      const response = await request(app)
        .put(`/api/cart/${cartId}`)
        .send({
          items: [{
            productId: 'invalid',
            qty: 1,
            priceAtTime: 5.99
          }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid productId');
    });

    it('should fail with invalid quantity in items', async () => {
      const response = await request(app)
        .put(`/api/cart/${cartId}`)
        .send({
          items: [{
            productId: productId.toString(),
            qty: 0,
            priceAtTime: 5.99
          }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('qty must be >= 1');
    });
  });

  describe('DELETE /api/cart/:id', () => {
    let cartId;

    beforeEach(async () => {
      const cart = await Cart.create({
        userId: userId.toString(),
        items: [{
          productId: productId,
          qty: 2,
          priceAtTime: 5.99
        }],
        status: 'ACTIVE'
      });
      cartId = cart._id;
    });

    it('should delete cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/${cartId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion
      const cart = await Cart.findById(cartId);
      expect(cart).toBeNull();
    });

    it('should fail with invalid cart ID', async () => {
      const response = await request(app)
        .delete('/api/cart/invalidid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid cart id');
    });

    it('should fail with non-existent cart ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/cart/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart not found');
    });
  });

  describe('Cart Integration Flow', () => {
    it('should complete full cart flow: add -> get -> summary -> merge', async () => {
      // Step 1: Add item as guest
      const guestId = 'guest-flow';
      await request(app)
        .post('/api/cart/items')
        .set('x-guest-id', guestId)
        .send({
          productId: productId.toString(),
          qty: 2
        })
        .expect(201);

      // Step 2: Get guest cart summary
      const summaryResponse = await request(app)
        .get('/api/cart/summary')
        .set('x-guest-id', guestId)
        .expect(200);

      expect(summaryResponse.body.summary.subtotal).toBe(5.99 * 2);

      // Step 3: Merge guest cart to user
      const mergeResponse = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', userToken)
        .set('x-guest-id', guestId)
        .send({ guestUserId: guestId })
        .expect(200);

      expect(mergeResponse.body.merged).toBe(true);

      // Step 4: Get user cart
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', userToken)
        .expect(200);

      expect(cartResponse.body.cart.items).toHaveLength(1);
      expect(cartResponse.body.cart.items[0].qty).toBe(2);
    });
  });
});
