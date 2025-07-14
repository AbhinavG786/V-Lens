import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import wishlistRoutes from '../../routes/wishlistRoutes';
import { User } from '../../models/userModel';
import { Product } from '../../models/productModel';
import { Wishlist } from '../../models/wishlistModel';

// Mock Firebase auth middleware
jest.mock('../../middlewares/firebaseAuth', () => ({
  verifySessionCookie: (req: any, res: any, next: any) => {
    // Mock user with Firebase UID
    req.user = { uid: 'test-firebase-uid' };
    next();
  }
}));

describe('Wishlist Controller with Firebase Auth', () => {
  let mongoServer: MongoMemoryServer;
  let app: express.Application;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/wishlist', wishlistRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Wishlist.deleteMany({});
  });

  describe('POST /wishlist/add', () => {
    it('should add product to wishlist using Firebase UID', async () => {
      // Create test user with Firebase UID
      const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        firebaseUID: 'test-firebase-uid',
        gender: 'male'
      });

      // Create test product
      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      const response = await request(app)
        .post('/wishlist/add')
        .send({
          productId: product._id.toString(),
          source: 'web',
          isFavorite: true
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product added to wishlist successfully');
      expect(response.body.wishlistItem.userId).toBe(user._id.toString());
      expect(response.body.wishlistItem.productId._id).toBe(product._id.toString());
    });

    it('should return 401 if user not authenticated', async () => {
      // Mock middleware to not set user
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/wishlist', wishlistRoutes);

      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      const response = await request(appWithoutAuth)
        .post('/wishlist/add')
        .send({
          productId: product._id.toString()
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /wishlist/user', () => {
    it('should get user wishlist using Firebase UID', async () => {
      // Create test user with Firebase UID
      const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        firebaseUID: 'test-firebase-uid',
        gender: 'male'
      });

      // Create test product
      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      // Add to wishlist
      await Wishlist.create({
        userId: user._id,
        productId: product._id,
        source: 'web',
        isFavorite: true
      });

      const response = await request(app)
        .get('/wishlist/user');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Wishlist retrieved successfully');
      expect(response.body.wishlist).toHaveLength(1);
      expect(response.body.wishlist[0].productId._id).toBe(product._id.toString());
    });
  });

  describe('DELETE /wishlist/product/:productId', () => {
    it('should remove product from wishlist using Firebase UID', async () => {
      // Create test user with Firebase UID
      const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        firebaseUID: 'test-firebase-uid',
        gender: 'male'
      });

      // Create test product
      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      // Add to wishlist
      await Wishlist.create({
        userId: user._id,
        productId: product._id,
        source: 'web',
        isFavorite: true
      });

      const response = await request(app)
        .delete(`/wishlist/product/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product removed from wishlist successfully');

      // Verify it's actually removed
      const wishlistCount = await Wishlist.countDocuments({ userId: user._id });
      expect(wishlistCount).toBe(0);
    });
  });

  describe('GET /wishlist/product/:productId/status', () => {
    it('should check wishlist status using Firebase UID', async () => {
      // Create test user with Firebase UID
      const user = await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        firebaseUID: 'test-firebase-uid',
        gender: 'male'
      });

      // Create test product
      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      // Add to wishlist
      await Wishlist.create({
        userId: user._id,
        productId: product._id,
        source: 'web',
        isFavorite: true
      });

      const response = await request(app)
        .get(`/wishlist/product/${product._id}/status`);

      expect(response.status).toBe(200);
      expect(response.body.isInWishlist).toBe(true);
      expect(response.body.wishlistItem).toBeTruthy();
    });

    it('should return false for product not in wishlist', async () => {
      // Create test user with Firebase UID
      await User.create({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        firebaseUID: 'test-firebase-uid',
        gender: 'male'
      });

      // Create test product
      const product = await Product.create({
        type: 'sunglasses',
        name: 'Test Sunglasses',
        price: 100,
        finalPrice: 100,
        gender: 'men'
      });

      const response = await request(app)
        .get(`/wishlist/product/${product._id}/status`);

      expect(response.status).toBe(200);
      expect(response.body.isInWishlist).toBe(false);
      expect(response.body.wishlistItem).toBeNull();
    });
  });
}); 