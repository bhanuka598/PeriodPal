const request = require('supertest');
const { app } = require('./setup');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

describe('Product API Integration Tests', () => {
  let adminToken;

  beforeEach(async () => {
    // Create admin user and get token
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin@1234',
      role: 'admin',
      location: 'Colombo'
    });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@1234'
      });

    adminToken = loginResponse.body.token;
  });

  describe('POST /api/products', () => {
    it('should create a product with admin token', async () => {
      const productData = {
        name: 'Sanitary Pad',
        category: 'Hygiene',
        description: 'Premium sanitary pads',
        price: 5.99,
        stockQty: 100,
        priorityTag: 'HIGH'
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', adminToken)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product).toHaveProperty('_id');
      expect(response.body.product.name).toBe(productData.name);
      expect(response.body.product.category).toBe(productData.category);
      expect(response.body.product.price).toBe(productData.price);

      // Verify product was saved to database
      const product = await Product.findOne({ name: productData.name });
      expect(product).toBeTruthy();
      expect(product.name).toBe(productData.name);
    });

    it('should fail to create product without admin token', async () => {
      const productData = {
        name: 'Sanitary Pad',
        category: 'Hygiene',
        price: 5.99,
        stockQty: 100
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create product with missing required fields', async () => {
      const productData = {
        name: 'Sanitary Pad'
        // Missing category, price, stockQty
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', adminToken)
        .send(productData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail to create product with negative price', async () => {
      const productData = {
        name: 'Sanitary Pad',
        category: 'Hygiene',
        price: -5.99,
        stockQty: 100
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', adminToken)
        .send(productData)
        .expect(500);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.create([
        {
          name: 'Sanitary Pad',
          category: 'Hygiene',
          price: 5.99,
          stockQty: 100,
          priorityTag: 'HIGH'
        },
        {
          name: 'Tampon',
          category: 'Hygiene',
          price: 4.99,
          stockQty: 50,
          priorityTag: 'MEDIUM'
        },
        {
          name: 'Menstrual Cup',
          category: 'Reusable',
          price: 15.99,
          stockQty: 30,
          priorityTag: 'LOW'
        }
      ]);
    });

    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(3);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Hygiene')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.category === 'Hygiene')).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?q=pad')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].name.toLowerCase()).toContain('pad');
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=5&maxPrice=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.every(p => p.price >= 5 && p.price <= 10)).toBe(true);
    });

    it('should combine filters (category + price)', async () => {
      const response = await request(app)
        .get('/api/products?category=Hygiene&minPrice=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products.every(p => 
        p.category === 'Hygiene' && p.price >= 5
      )).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Sanitary Pad',
        category: 'Hygiene',
        price: 5.99,
        stockQty: 100
      });
      productId = product._id;
    });

    it('should get product by valid ID', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.product).toHaveProperty('_id');
      expect(response.body.product.name).toBe('Sanitary Pad');
    });

    it('should fail to get product with invalid ID', async () => {
      const response = await request(app)
        .get('/api/products/invalidid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid product id');
    });

    it('should fail to get product with non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Sanitary Pad',
        category: 'Hygiene',
        price: 5.99,
        stockQty: 100
      });
      productId = product._id;
    });

    it('should update product with admin token', async () => {
      const updateData = {
        name: 'Premium Sanitary Pad',
        price: 7.99,
        stockQty: 150
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', adminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe(updateData.name);
      expect(response.body.product.price).toBe(updateData.price);

      // Verify update in database
      const product = await Product.findById(productId);
      expect(product.name).toBe(updateData.name);
      expect(product.price).toBe(updateData.price);
    });

    it('should fail to update product without admin token', async () => {
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to update non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .set('Authorization', adminToken)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let productId;

    beforeEach(async () => {
      const product = await Product.create({
        name: 'Sanitary Pad',
        category: 'Hygiene',
        price: 5.99,
        stockQty: 100
      });
      productId = product._id;
    });

    it('should delete product with admin token', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify deletion in database
      const product = await Product.findById(productId);
      expect(product).toBeNull();
    });

    it('should fail to delete product without admin token', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail to delete non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set('Authorization', adminToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('Product CRUD Integration Flow', () => {
    it('should complete full product lifecycle: create -> read -> update -> delete', async () => {
      // Step 1: Create
      const createData = {
        name: 'Test Product',
        category: 'Test',
        price: 10.99,
        stockQty: 50
      };

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', adminToken)
        .send(createData)
        .expect(201);

      const productId = createResponse.body.product._id;

      // Step 2: Read
      const readResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(readResponse.body.product.name).toBe(createData.name);

      // Step 3: Update
      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', adminToken)
        .send({ price: 15.99 })
        .expect(200);

      expect(updateResponse.body.product.price).toBe(15.99);

      // Step 4: Delete
      const deleteResponse = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      const verifyResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);
    });
  });
});
