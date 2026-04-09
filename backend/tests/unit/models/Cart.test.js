const Cart = require('../../../src/models/Cart');
const mongoose = require('mongoose');

describe('Cart Model', () => {
  const mockProductId = new mongoose.Types.ObjectId();

  describe('Valid Cart Creation', () => {
    it('should create a cart with required fields', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          productId: mockProductId,
          qty: 2,
          priceAtTime: 10.99
        }]
      };

      const cart = await Cart.create(cartData);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe('user123');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].qty).toBe(2);
      expect(cart.items[0].priceAtTime).toBe(10.99);
      expect(cart.status).toBe('ACTIVE');
    });

    it('should create a cart with default empty items array', async () => {
      const cart = await Cart.create({
        userId: 'guest123'
      });

      expect(cart.items).toEqual([]);
      expect(cart.status).toBe('ACTIVE');
    });

    it('should create a cart with GUEST userId', async () => {
      const cart = await Cart.create({
        userId: 'GUEST',
        items: []
      });

      expect(cart.userId).toBe('GUEST');
    });

    it('should create a cart with multiple items', async () => {
      const cartData = {
        userId: 'user456',
        items: [
          { productId: new mongoose.Types.ObjectId(), qty: 1, priceAtTime: 5.00 },
          { productId: new mongoose.Types.ObjectId(), qty: 3, priceAtTime: 15.50 },
          { productId: new mongoose.Types.ObjectId(), qty: 2, priceAtTime: 8.99 }
        ]
      };

      const cart = await Cart.create(cartData);

      expect(cart.items).toHaveLength(3);
      expect(cart.items[0].qty).toBe(1);
      expect(cart.items[1].qty).toBe(3);
      expect(cart.items[2].qty).toBe(2);
    });
  });

  describe('Status Enum Validation', () => {
    it('should accept valid status values', async () => {
      const statuses = ['ACTIVE', 'CHECKED_OUT', 'CANCELLED'];

      for (const status of statuses) {
        const cart = await Cart.create({
          userId: `user_${status}`,
          status
        });
        expect(cart.status).toBe(status);
      }
    });

    it('should default status to ACTIVE', async () => {
      const cart = await Cart.create({
        userId: 'user789'
      });

      expect(cart.status).toBe('ACTIVE');
    });
  });

  describe('Cart Item Validation', () => {
    it('should require productId in items', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          qty: 2,
          priceAtTime: 10.99
        }]
      };

      await expect(Cart.create(cartData)).rejects.toThrow();
    });

    it('should require qty in items', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          productId: mockProductId,
          priceAtTime: 10.99
        }]
      };

      await expect(Cart.create(cartData)).rejects.toThrow();
    });

    it('should require priceAtTime in items', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          productId: mockProductId,
          qty: 2
        }]
      };

      await expect(Cart.create(cartData)).rejects.toThrow();
    });

    it('should reject qty less than 1', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          productId: mockProductId,
          qty: 0,
          priceAtTime: 10.99
        }]
      };

      await expect(Cart.create(cartData)).rejects.toThrow();
    });

    it('should reject negative priceAtTime', async () => {
      const cartData = {
        userId: 'user123',
        items: [{
          productId: mockProductId,
          qty: 2,
          priceAtTime: -5.00
        }]
      };

      await expect(Cart.create(cartData)).rejects.toThrow();
    });
  });

  describe('Required Fields', () => {
    it('should require userId', async () => {
      await expect(Cart.create({})).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should update cart items', async () => {
      const cart = await Cart.create({
        userId: 'user123',
        items: [{
          productId: mockProductId,
          qty: 1,
          priceAtTime: 10.00
        }]
      });

      cart.items[0].qty = 5;
      const updated = await cart.save();

      expect(updated.items[0].qty).toBe(5);
    });

    it('should change cart status', async () => {
      const cart = await Cart.create({
        userId: 'user123',
        status: 'ACTIVE'
      });

      cart.status = 'CHECKED_OUT';
      const updated = await cart.save();

      expect(updated.status).toBe('CHECKED_OUT');
    });

    it('should find cart by userId', async () => {
      await Cart.create({
        userId: 'specificUser',
        items: [{ productId: mockProductId, qty: 1, priceAtTime: 5.00 }]
      });

      const found = await Cart.findOne({ userId: 'specificUser' });

      expect(found).toBeDefined();
      expect(found.userId).toBe('specificUser');
    });

    it('should find active cart for user', async () => {
      await Cart.create({
        userId: 'activeUser',
        status: 'ACTIVE'
      });

      const found = await Cart.findOne({ userId: 'activeUser', status: 'ACTIVE' });

      expect(found).toBeDefined();
      expect(found.status).toBe('ACTIVE');
    });

    it('should delete a cart', async () => {
      const cart = await Cart.create({
        userId: 'deleteUser',
        items: []
      });

      await Cart.deleteOne({ _id: cart._id });

      const found = await Cart.findById(cart._id);
      expect(found).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const cart = await Cart.create({
        userId: 'timestampUser'
      });

      expect(cart.createdAt).toBeInstanceOf(Date);
      expect(cart.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Cart with ObjectId userId', () => {
    it('should accept ObjectId as userId string', async () => {
      const userObjectId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: userObjectId.toString(),
        items: [{ productId: mockProductId, qty: 1, priceAtTime: 10.00 }]
      });

      expect(cart.userId).toBe(userObjectId.toString());
    });
  });
});
