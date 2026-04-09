const productController = require('../../../src/controllers/productController');
const Product = require('../../../src/models/Product');

jest.mock('../../../src/models/Product');

describe('Product Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { _id: 'prod1', name: 'Pads', category: 'Essentials', price: 10 },
        { _id: 'prod2', name: 'Tampons', category: 'Essentials', price: 15 }
      ];

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      await productController.getProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, products: mockProducts });
    });

    it('should filter by category', async () => {
      req.query = { category: 'Essentials' };

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ name: 'Pads', category: 'Essentials' }])
      });

      await productController.getProducts(req, res, next);

      expect(Product.find).toHaveBeenCalledWith({ category: 'Essentials' });
    });

    it('should filter by search query', async () => {
      req.query = { q: 'pads' };

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ name: 'Sanitary Pads' }])
      });

      await productController.getProducts(req, res, next);

      expect(Product.find).toHaveBeenCalledWith({ name: { $regex: 'pads', $options: 'i' } });
    });

    it('should filter by price range', async () => {
      req.query = { minPrice: '5', maxPrice: '20' };

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await productController.getProducts(req, res, next);

      expect(Product.find).toHaveBeenCalledWith({
        price: { $gte: 5, $lte: 20 }
      });
    });

    it('should combine multiple filters', async () => {
      req.query = { category: 'Essentials', q: 'pads', minPrice: '5' };

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await productController.getProducts(req, res, next);

      expect(Product.find).toHaveBeenCalledWith({
        category: 'Essentials',
        name: { $regex: 'pads', $options: 'i' },
        price: { $gte: 5 }
      });
    });
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      req.body = {
        name: 'Sanitary Pads',
        category: 'Essentials',
        price: '15.99',
        stockQty: '100',
        description: 'High quality pads',
        priorityTag: 'HIGH'
      };

      const mockProduct = {
        _id: 'prod123',
        name: 'Sanitary Pads',
        category: 'Essentials',
        price: 15.99,
        stockQty: 100
      };

      Product.create.mockResolvedValue(mockProduct);

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, product: mockProduct });
    });

    it('should create product with uploaded image', async () => {
      req.body = {
        name: 'Product',
        category: 'Essentials',
        price: '10',
        stockQty: '50'
      };
      req.file = { filename: 'image123.jpg' };

      Product.create.mockResolvedValue({
        name: 'Product',
        imageUrl: '/uploads/products/image123.jpg'
      });

      await productController.createProduct(req, res, next);

      expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
        imageUrl: '/uploads/products/image123.jpg'
      }));
    });

    it('should return 400 if name is missing', async () => {
      req.body = {
        category: 'Essentials',
        price: '10',
        stockQty: '50'
      };

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Name, category, price, and stockQty are required'
      }));
    });

    it('should return 400 if category is missing', async () => {
      req.body = {
        name: 'Product',
        price: '10',
        stockQty: '50'
      };

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if price is invalid', async () => {
      req.body = {
        name: 'Product',
        category: 'Essentials',
        price: 'invalid',
        stockQty: '50'
      };

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if stockQty is invalid', async () => {
      req.body = {
        name: 'Product',
        category: 'Essentials',
        price: '10',
        stockQty: 'invalid'
      };

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should use provided imageUrl if no file uploaded', async () => {
      req.body = {
        name: 'Product',
        category: 'Essentials',
        price: '10',
        stockQty: '50',
        imageUrl: 'https://example.com/image.jpg'
      };

      Product.create.mockResolvedValue({});

      await productController.createProduct(req, res, next);

      expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
        imageUrl: 'https://example.com/image.jpg'
      }));
    });

    it('should default to empty string if no imageUrl provided', async () => {
      req.body = {
        name: 'Product',
        category: 'Essentials',
        price: '10',
        stockQty: '50'
      };

      Product.create.mockResolvedValue({});

      await productController.createProduct(req, res, next);

      expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
        imageUrl: ''
      }));
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockProduct = { _id: '507f1f77bcf86cd799439011', name: 'Pads', price: 10 };
      Product.findById.mockResolvedValue(mockProduct);

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, product: mockProduct });
    });

    it('should return 400 for invalid product ID', async () => {
      req.params = { id: 'invalid-id' };

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid product id' });
    });

    it('should return 404 if product not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Product.findById.mockResolvedValue(null);

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 for server errors', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Product.findById.mockRejectedValue(new Error('Database error'));

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {
        name: 'Updated Product',
        price: '20',
        stockQty: '150'
      };

      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Product',
        price: 20,
        stockQty: 150
      };

      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);

      await productController.updateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Product updated'
      }));
    });

    it('should return 400 for invalid product ID', async () => {
      req.params = { id: 'invalid-id' };

      await productController.updateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if product not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { name: 'Updated' };

      Product.findByIdAndUpdate.mockResolvedValue(null);

      await productController.updateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update image when file is uploaded', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = { name: 'Updated Product' };
      req.file = { filename: 'newimage.jpg' };

      Product.findByIdAndUpdate.mockResolvedValue({ name: 'Updated Product' });

      await productController.updateProduct(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ imageUrl: '/uploads/products/newimage.jpg' }),
        { new: true, runValidators: true }
      );
    });

    it('should only update allowed fields', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {
        name: 'Updated',
        price: '25',
        notAllowedField: 'should be ignored'
      };

      Product.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });

      await productController.updateProduct(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.not.objectContaining({ notAllowedField: 'should be ignored' }),
        { new: true, runValidators: true }
      );
    });

    it('should trim name and category', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      req.body = {
        name: '  Trimmed Name  ',
        category: '  Trimmed Category  '
      };

      Product.findByIdAndUpdate.mockResolvedValue({});

      await productController.updateProduct(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'Trimmed Name',
          category: 'Trimmed Category'
        }),
        expect.any(Object)
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      const mockProduct = { _id: '507f1f77bcf86cd799439011', name: 'Deleted Product' };
      Product.findByIdAndDelete.mockResolvedValue(mockProduct);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Product deleted'
      }));
    });

    it('should return 400 for invalid product ID', async () => {
      req.params = { id: 'invalid-id' };

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if product not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Product.findByIdAndDelete.mockResolvedValue(null);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 for server errors', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };

      Product.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
