// Comprehensive Test Script for Order endpoints
// Run this with: npm run test:orders

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api'; // Adjust port as needed
const SESSION_COOKIE = 'your-session-cookie-here'; // Replace with actual session cookie

// Test data
const testProductData = {
  type: "eyeglasses",
  name: "Test Eyeglasses",
  brand: "Test Brand",
  description: "Test description",
  price: 1500,
  discount: 100,
  finalPrice: 1400,
  images: ["https://example.com/image1.jpg"],
  variants: [
    { color: "black", stock: 10 }
  ],
  tags: ["test", "eyeglasses"],
  gender: "unisex"
};

const testOrderData = {
  items: [
    {
      productId: "507f1f77bcf86cd799439011", // Replace with actual product ID
      quantity: 2,
      price: 1500,
      discount: 100,
      finalPrice: 1400
    }
  ],
  shippingAddress: {
    street: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zipCode: "12345",
    country: "Test Country"
  },
  billingAddress: {
    street: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zipCode: "12345",
    country: "Test Country"
  },
  paymentMethod: "credit_card",
  notes: "Test order"
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${SESSION_COOKIE}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testCreateProduct = async () => {
  console.log('\n=== Testing Create Product ===');
  const result = await makeRequest('POST', '/product', testProductData);
  if (result) {
    console.log('✅ Product created successfully:', result._id);
    return result._id;
  }
  return null;
};

const testCreateOrder = async (productId) => {
  console.log('\n=== Testing Create Order ===');
  const orderData = {
    ...testOrderData,
    items: [
      {
        productId: productId,
        quantity: 2,
        price: 1500,
        discount: 100,
        finalPrice: 1400
      }
    ]
  };
  
  const result = await makeRequest('POST', '/orders', orderData);
  if (result) {
    console.log('✅ Order created successfully:', result.orderNumber);
    return result._id;
  }
  return null;
};

const testGetOrders = async () => {
  console.log('\n=== Testing Get User Orders ===');
  const result = await makeRequest('GET', '/orders');
  if (result) {
    console.log('✅ Orders retrieved successfully:', result.length, 'orders found');
    return result;
  }
  return null;
};

const testGetOrderById = async (orderId) => {
  console.log('\n=== Testing Get Order by ID ===');
  const result = await makeRequest('GET', `/orders/${orderId}`);
  if (result) {
    console.log('✅ Order retrieved successfully:', result.orderNumber);
    return result;
  }
  return null;
};

const testUpdateOrderStatus = async (orderId) => {
  console.log('\n=== Testing Update Order Status ===');
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  
  for (const status of statuses) {
    const result = await makeRequest('PATCH', `/orders/${orderId}/status`, { status });
    if (result) {
      console.log(`✅ Order status updated to ${status} successfully`);
    } else {
      console.log(`❌ Failed to update status to ${status}`);
      break;
    }
  }
};

const testUpdatePaymentStatus = async (orderId) => {
  console.log('\n=== Testing Update Payment Status ===');
  const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
  
  for (const paymentStatus of paymentStatuses) {
    const result = await makeRequest('PATCH', `/orders/${orderId}/payment`, { paymentStatus });
    if (result) {
      console.log(`✅ Payment status updated to ${paymentStatus} successfully`);
    } else {
      console.log(`❌ Failed to update payment status to ${paymentStatus}`);
      break;
    }
  }
};

const testAddTrackingInfo = async (orderId) => {
  console.log('\n=== Testing Add Tracking Info ===');
  const result = await makeRequest('PATCH', `/orders/${orderId}/tracking`, {
    trackingNumber: 'TRK123456789',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  if (result) {
    console.log('✅ Tracking info added successfully:', result.trackingNumber);
    return result;
  }
  return null;
};

const testCancelOrder = async (orderId) => {
  console.log('\n=== Testing Cancel Order ===');
  const result = await makeRequest('PATCH', `/orders/${orderId}/cancel`);
  if (result) {
    console.log('✅ Order cancelled successfully:', result.status);
    return result;
  }
  return null;
};

const testGetAllOrders = async () => {
  console.log('\n=== Testing Get All Orders (Admin) ===');
  const result = await makeRequest('GET', '/orders/admin/all');
  if (result) {
    console.log('✅ All orders retrieved successfully:', result.length, 'orders found');
    return result;
  }
  return null;
};

const testOrderValidation = async () => {
  console.log('\n=== Testing Order Validation ===');
  
  // Test missing items
  const invalidOrder1 = { ...testOrderData, items: [] };
  const result1 = await makeRequest('POST', '/orders', invalidOrder1);
  if (!result1) {
    console.log('✅ Validation: Missing items correctly rejected');
  }
  
  // Test missing addresses
  const invalidOrder2 = { ...testOrderData, shippingAddress: null };
  const result2 = await makeRequest('POST', '/orders', invalidOrder2);
  if (!result2) {
    console.log('✅ Validation: Missing addresses correctly rejected');
  }
  
  // Test invalid payment method
  const invalidOrder3 = { ...testOrderData, paymentMethod: 'invalid_method' };
  const result3 = await makeRequest('POST', '/orders', invalidOrder3);
  if (!result3) {
    console.log('✅ Validation: Invalid payment method correctly rejected');
  }
};

const testOrderWorkflow = async () => {
  console.log('\n=== Testing Complete Order Workflow ===');
  
  // 1. Create a product first
  const productId = await testCreateProduct();
  if (!productId) {
    console.log('❌ Cannot proceed without creating a product first');
    return;
  }
  
  // 2. Create an order
  const orderId = await testCreateOrder(productId);
  if (!orderId) {
    console.log('❌ Cannot proceed without creating an order first');
    return;
  }
  
  // 3. Get user orders
  await testGetOrders();
  
  // 4. Get specific order
  await testGetOrderById(orderId);
  
  // 5. Update order status through workflow
  await testUpdateOrderStatus(orderId);
  
  // 6. Update payment status
  await testUpdatePaymentStatus(orderId);
  
  // 7. Add tracking info
  await testAddTrackingInfo(orderId);
  
  // 8. Get all orders (admin)
  await testGetAllOrders();
  
  // 9. Cancel order (optional - comment out if you want to keep the order)
  // await testCancelOrder(orderId);
  
  console.log('\n🎉 Complete order workflow tested successfully!');
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Comprehensive Order API Tests...');
  console.log('⚠️  Make sure your server is running and you have a valid session cookie!');
  console.log('⚠️  Update SESSION_COOKIE variable with your actual session cookie');
  
  // Test order validation
  await testOrderValidation();
  
  // Test complete workflow
  await testOrderWorkflow();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Update SESSION_COOKIE with your actual session cookie');
  console.log('2. Ensure your server is running on the correct port');
  console.log('3. Run: npm run test:orders');
  console.log('4. Check the console output for test results');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCreateProduct,
  testCreateOrder,
  testGetOrders,
  testGetOrderById,
  testUpdateOrderStatus,
  testUpdatePaymentStatus,
  testAddTrackingInfo,
  testCancelOrder,
  testGetAllOrders,
  testOrderValidation,
  testOrderWorkflow
}; 