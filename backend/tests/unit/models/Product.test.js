const Product = require('../../../src/models/Product');

describe('Product Model', () => {
  describe('Valid Product Creation', () => {
    it('should create product with all required fields', async () => {
      const productData = {
        name: 'Sanitary Pads',
        category: 'Menstrual Products',
        price: 15.99,
        stockQty: 100
      };

      const product = await Product.create(productData);

      expect(product).toBeDefined();
      expect(product.name).toBe('Sanitary Pads');
      expect(product.category).toBe('Menstrual Products');
      expect(product.price).toBe(15.99);
      expect(product.stockQty).toBe(100);
      expect(product.priorityTag).toBe('MEDIUM');
    });

    it('should create product with all fields', async () => {
      const productData = {
        name: 'Premium Tampons',
        category: 'Menstrual Products',
        description: 'High-quality organic tampons',
        imageUrl: 'https://example.com/tampons.jpg',
        price: 12.99,
        stockQty: 50,
        priorityTag: 'HIGH'
      };

      const product = await Product.create(productData);

      expect(product.description).toBe('High-quality organic tampons');
      expect(product.imageUrl).toBe('https://example.com/tampons.jpg');
      expect(product.priorityTag).toBe('HIGH');
    });

    it('should create product with default values', async () => {
      const product = await Product.create({
        name: 'Basic Pads',
        category: 'Essentials',
        price: 5.00,
        stockQty: 200
      });

      expect(product.description).toBe('');
      expect(product.imageUrl).toBe('');
      expect(product.priorityTag).toBe('MEDIUM');
    });
  });

  describe('Validation Errors', () => {
    it('should fail without name', async () => {
      const productData = {
        category: 'Essentials',
        price: 10.00,
        stockQty: 50
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without category', async () => {
      const productData = {
        name: 'Product',
        price: 10.00,
        stockQty: 50
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without price', async () => {
      const productData = {
        name: 'Product',
        category: 'Essentials',
        stockQty: 50
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should fail without stockQty', async () => {
      const productData = {
        name: 'Product',
        category: 'Essentials',
        price: 10.00
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should reject negative price', async () => {
      const productData = {
        name: 'Product',
        category: 'Essentials',
        price: -10.00,
        stockQty: 50
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should reject negative stockQty', async () => {
      const productData = {
        name: 'Product',
        category: 'Essentials',
        price: 10.00,
        stockQty: -50
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });
  });

  describe('Priority Tag Enum', () => {
    it('should accept valid priorityTag values', async () => {
      const tags = ['LOW', 'MEDIUM', 'HIGH'];

      for (const tag of tags) {
        const product = await Product.create({
          name: `${tag} Priority Product`,
          category: 'Test',
          price: 10.00,
          stockQty: 50,
          priorityTag: tag
        });
        expect(product.priorityTag).toBe(tag);
      }
    });

    it('should default priorityTag to MEDIUM', async () => {
      const product = await Product.create({
        name: 'Default Priority Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      expect(product.priorityTag).toBe('MEDIUM');
    });
  });

  describe('String Trimming', () => {
    it('should trim name', async () => {
      const product = await Product.create({
        name: '  Padded Name  ',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      expect(product.name).toBe('Padded Name');
    });

    it('should trim category', async () => {
      const product = await Product.create({
        name: 'Product',
        category: '  Trimmed Category  ',
        price: 10.00,
        stockQty: 50
      });

      expect(product.category).toBe('Trimmed Category');
    });
  });

  describe('Database Operations', () => {
    it('should update product price', async () => {
      const product = await Product.create({
        name: 'Price Update Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      product.price = 15.00;
      const updated = await product.save();

      expect(updated.price).toBe(15.00);
    });

    it('should update product stock', async () => {
      const product = await Product.create({
        name: 'Stock Update Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      product.stockQty = 75;
      const updated = await product.save();

      expect(updated.stockQty).toBe(75);
    });

    it('should find product by name', async () => {
      await Product.create({
        name: 'Searchable Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      const found = await Product.findOne({ name: 'Searchable Product' });

      expect(found).toBeDefined();
      expect(found.price).toBe(10.00);
    });

    it('should find products by category', async () => {
      await Product.create({
        name: 'Product 1',
        category: 'Category A',
        price: 10.00,
        stockQty: 50
      });

      await Product.create({
        name: 'Product 2',
        category: 'Category A',
        price: 15.00,
        stockQty: 30
      });

      await Product.create({
        name: 'Product 3',
        category: 'Category B',
        price: 20.00,
        stockQty: 20
      });

      const categoryAProducts = await Product.find({ category: 'Category A' });

      expect(categoryAProducts).toHaveLength(2);
    });

    it('should sort products by creation date', async () => {
      await Product.create({
        name: 'Old Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Product.create({
        name: 'New Product',
        category: 'Test',
        price: 15.00,
        stockQty: 30
      });

      const products = await Product.find().sort({ createdAt: -1 });

      expect(products[0].name).toBe('New Product');
      expect(products[1].name).toBe('Old Product');
    });

    it('should delete a product', async () => {
      const product = await Product.create({
        name: 'Delete Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      await Product.deleteOne({ _id: product._id });

      const found = await Product.findById(product._id);
      expect(found).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const product = await Product.create({
        name: 'Timestamp Product',
        category: 'Test',
        price: 10.00,
        stockQty: 50
      });

      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });
  });
});
