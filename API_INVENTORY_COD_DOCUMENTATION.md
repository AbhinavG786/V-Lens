# Inventory Management & Cash on Delivery (COD) API Documentation

## Overview

This document outlines the new inventory management and Cash on Delivery (COD) features implemented in the e-commerce system. The system now properly manages stock levels across multiple warehouses and supports COD orders with admin-controlled status updates.

## Key Features Implemented

### 1. **Stock Validation During Order Creation**
- Orders are validated against available inventory before creation
- Prevents overselling by checking total stock across all warehouses
- Returns clear error messages for insufficient stock

### 2. **Automatic Inventory Deduction**
- For online payments: Stock is deducted after successful payment verification
- For COD orders: Stock is deducted immediately when order is placed (stock reservation)
- Maintains inventory consistency across multiple warehouses

### 3. **Multi-Warehouse Support**
- Admin can view which warehouses have stock for specific products
- Admin assigns specific warehouses to order items
- Supports different stock levels across different warehouses

### 4. **Cash on Delivery (COD) Management**
- Three-stage COD workflow: Order Confirmed → In Transit → Order Delivered
- Admin manually controls each stage
- Payment is marked as completed only when order is delivered

## API Endpoints

### Order Management

#### 1. Create Order (Enhanced)
```
POST /api/orders/
```

**Changes:**
- Now validates stock availability before order creation
- Supports COD payment method
- For COD orders, no Razorpay order is created
- Order items now include `warehouseId` field (initially null)

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {...},
  "billingAddress": {...},
  "paymentMethod": "cod", // or "credit_card", "debit_card", "upi", "net_banking"
  "prescriptionId": "prescription_id",
  "notes": "Special instructions"
}
```

**Response for COD:**
```json
{
  "Order": {
    "_id": "order_id",
    "orderNumber": "ORD-1234567890-abc123",
    "items": [
      {
        "productId": "product_id",
        "quantity": 2,
        "warehouseId": null, // Admin will assign
        "price": 1000,
        "finalPrice": 800,
        "gstAmount": 144
      }
    ],
    "paymentMethod": "cod",
    "codStatus": {
      "orderConfirmed": false,
      "inTransit": false,
      "orderDelivered": false
    },
    "status": "pending",
    "totalAmount": 1144
  },
  "message": "COD order created successfully. Admin will assign warehouses."
}
```

#### 2. Assign Warehouses to Order Items (Admin Only)
```
PATCH /api/orders/:orderId/assign-warehouses
```

**Request Body:**
```json
{
  "itemAssignments": [
    {
      "productId": "product_id_1",
      "warehouseId": "warehouse_id_1"
    },
    {
      "productId": "product_id_2", 
      "warehouseId": "warehouse_id_2"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Warehouses assigned successfully",
  "order": {
    // Updated order with warehouse assignments
  }
}
```

**Note:** For COD orders, warehouse assignment doesn't require stock validation since inventory was already deducted at order creation. For online payments, stock validation occurs during warehouse assignment.

#### 3. Update COD Status (Admin Only)
```
PATCH /api/orders/:orderId/cod-status
```

**Request Body:**
```json
{
  "statusField": "orderConfirmed", // or "inTransit" or "orderDelivered"
  "value": true
}
```

**Response:**
```json
{
  "message": "COD status updated successfully",
  "order": {
    // Updated order with new COD status
  }
}
```

**Automatic Actions:**
- When `orderDelivered` is set to `true`:
  - Payment status becomes "completed"
  - Amount paid becomes total amount
  - Delivered timestamp is set
  - Note: Inventory was already deducted when order was created

#### 4. Get Available Warehouses for Product (Admin Only)
```
GET /api/orders/warehouses/:productId
```

**Response:**
```json
{
  "availableWarehouses": [
    {
      "_id": "inventory_id",
      "stock": 15,
      "warehouseId": {
        "_id": "warehouse_id",
        "warehouseName": "Mumbai Warehouse",
        "address": "123 Industrial Area, Mumbai",
        "contactNumber": "+91-9876543210"
      }
    }
  ]
}
```

### Payment Management

#### 1. Verify Payment (Enhanced)
```
POST /api/payments/verify
```

**Changes:**
- Now automatically deducts inventory after successful payment verification
- Only deducts inventory if warehouses are assigned to order items

#### 2. Manual Inventory Deduction for COD (Admin Only)
```
POST /api/payments/cod/:orderId/deduct-inventory
```

**Response:**
```json
{
  "message": "Inventory deducted successfully for COD order"
}
```

**Prerequisites:**
- Order must be COD
- Order must be marked as delivered
- Warehouses must be assigned to all order items
- Note: This endpoint is now mainly for manual inventory management, as inventory is automatically deducted at order creation

## Database Schema Changes

### Order Model Updates

```typescript
// Added to orderItemSchema
warehouseId: {
  type: Schema.Types.ObjectId,
  ref: "Warehouse",
  required: false, // Admin will assign this
}

// Added to orderSchema
codStatus: {
  orderConfirmed: {
    type: Boolean,
    default: false,
  },
  inTransit: {
    type: Boolean,
    default: false,
  },
  orderDelivered: {
    type: Boolean,
    default: false,
  },
  confirmedAt: {
    type: Date,
  },
  transitAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
}
```

## Workflow Examples

### Online Payment Workflow
1. Customer places order → Stock validation occurs
2. Razorpay order created → Customer pays
3. Payment verified → Inventory automatically deducted
4. Order fulfillment begins

### COD Workflow
1. Customer places COD order → Stock validation occurs → **Inventory deducted immediately**
2. Order created with pending status
3. **Admin assigns warehouses** to order items
4. **Admin marks "Order Confirmed"** → Customer notified
5. **Admin marks "In Transit"** → Shipping begins
6. **Admin marks "Order Delivered"** → Payment completed

### Multi-Warehouse Management
1. Admin views order requiring fulfillment
2. Admin checks available warehouses for each product
3. Admin assigns optimal warehouse to each item based on:
   - Stock availability
   - Location proximity to customer
   - Warehouse capacity
4. System validates assignments and updates order

## Error Handling

### Stock Validation Errors
```json
{
  "message": "Insufficient stock for product Wireless Headphones. Available: 5, Requested: 10"
}
```

### Warehouse Assignment Errors
```json
{
  "message": "Insufficient stock in warehouse for product product_id. Available: 3, Required: 5"
}
```

### COD Status Errors
```json
{
  "message": "COD status can only be updated for COD orders"
}
```

## Admin Dashboard Integration

### Required Admin Features
1. **Order Management Dashboard**
   - View orders pending warehouse assignment
   - Assign warehouses to order items
   - Update COD status in real-time

2. **Inventory Overview**
   - View stock levels by warehouse
   - See which warehouses have specific products
   - Monitor low stock alerts

3. **COD Tracking**
   - Track COD orders through 3-stage workflow
   - Bulk update COD statuses
   - Generate COD delivery reports

## Security Considerations

- All admin operations require `AdminAuthMiddleware.verifyAdminSession`
- Inventory deduction is atomic and transaction-safe
- Stock validation prevents race conditions in high-traffic scenarios
- COD status can only be updated by authenticated admins

## Performance Optimizations

- Aggregation pipelines for efficient stock calculations
- Indexed queries for fast warehouse lookups
- Minimal database round trips during order processing
- Cached inventory calculations where appropriate

This implementation provides a robust foundation for multi-warehouse inventory management and COD order processing while maintaining data consistency and preventing overselling.
