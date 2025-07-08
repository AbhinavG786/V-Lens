import request from 'supertest';
import app from '../../server';
import mongoose from 'mongoose';

// Mock admin session middleware for testing
jest.mock('../../middlewares/adminAuth', () => ({
  default: {
    verifyAdminSession: (_req: any, _res: any, next: any) => next(),
  },
}));

// Mock upload middleware for testing
jest.mock('../../middlewares/upload', () => {
  const actual = jest.requireActual('multer');
  return {
    __esModule: true,
    default: {
      single: () => (req: any, _res: any, next: any) => next(),
    },
  };
});

describe('Sunglass API', () => {
  let createdId: string;

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new sunglass', async () => {
    const res = await request(app)
      .post('/sunglasses')
      .send({
        name: 'Test Sunglass',
        brand: 'TestBrand',
        price: 1000,
        discount: 100,
        gender: 'unisex',
      });
    expect(res.status).toBe(201);
    expect(res.body.sunglass).toHaveProperty('_id');
    createdId = res.body.sunglass._id;
  });

  it('should get all sunglasses', async () => {
    const res = await request(app)
      .get('/sunglasses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should get a sunglass by id', async () => {
    const res = await request(app)
      .get(`/sunglasses/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', createdId);
  });

  it('should update a sunglass', async () => {
    const res = await request(app)
      .put(`/sunglasses/${createdId}`)
      .send({
        name: 'Updated Sunglass',
        price: 1200,
        discount: 200,
      });
    expect(res.status).toBe(200);
    expect(res.body.sunglass).toHaveProperty('name', 'Updated Sunglass');
  });

  it('should delete a sunglass', async () => {
    const res = await request(app)
      .delete(`/sunglasses/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Deleted successfully');
  });

  it('should return 404 for non-existent sunglass', async () => {
    const res = await request(app)
      .get('/sunglasses/000000000000000000000000');
    expect(res.status).toBe(404);
  });
}); 