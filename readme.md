Valsco Backend LensKart

# All Authentication APIs

# Frame Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/frame`

| Method | Endpoint         | Description                      | Request Type         | Image Upload  |  API Name  |  ADMIN/USER
|--------|------------------|----------------------------------|----------------------|-------------- |----------- |--------------
| POST   | `/create`        | Create new frame + product       | `multipart/form-data`| ✅ `"file"`  |createFrame | Admin
| GET    | `/all`           | Get all frames                   | -                    | ❌           |getAllFrames| User
| GET    | `/:id`           | Get frame by ID                  | -                    | ❌           |getFrameById| User
| PATCH  | `/:id`           | Update frame + product info      | `multipart/form-data`| ✅ `"image"` |updateFrame | Admin
| DELETE | `/:id`           | Delete frame + image             | -                    | ❌           |deleteFrame | Admin


# Lens Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/lens`

| Method | Endpoint         | Description                      | Request Type         | Image Upload  |  API Name          |  ADMIN/USER
|--------|------------------|----------------------------------|----------------------|-------------- |--------------------|--------------
| POST   | `/`              | Create new lens + product        | `multipart/form-data`| ✅ `"file"`  |createLens          | Admin
| GET    | `/all`           | Get all lens                     | -                    | ❌           |getAllLens          | User
| GET    | `/:lensId`       | Get lens by ID                   | -                    | ❌           |getLensById         | User
| PATCH  | `/:lensId`       | Update lens + product info       | `multipart/form-data`| ✅ `"file"`  |updateLensProduct   | Admin
| DELETE | `/:lensId`       | Delete lens + image              | -                    | ❌           |deleteLens          | Admin
| GET    | `/brand`         | Get lens by Brand                | -                    | ❌           |getLensByBrand      | User
| GET    | `/type`          | Get lens by Type                 | -                    | ❌           |getLensByType       | User
| GET    | `/priceRange`    | Get lens by Price Range          | -                    | ❌           |getLensByPriceRange | User



# Accessories Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/accessories`

| Method | Endpoint         | Description                      | Request Type         | Image Upload  |  API Name                 |  ADMIN/USER
|--------|------------------|----------------------------------|----------------------|-------------- |---------------------------|--------------
| POST   | `/`              | Create new accessories + product | `multipart/form-data`| ✅ `"file"`  |createAccessories          | Admin
| GET    | `/all`           | Get all accessories              | -                    | ❌           |getAllAccessories          | User
| GET    | `/:accessoriesId`| Get accessories by ID            | -                    | ❌           |getAccessoriesById         | User
| PATCH  | `/:accessoriesId`| Update accessories + product info| `multipart/form-data`| ✅ `"file"`  |updateAccessoriesProduct   | Admin
| DELETE | `/:accessoriesId`| Delete accessories + image       | -                    | ❌           |deleteAccessories          | Admin
| GET    | `/brand`         | Get accessories by Brand         | -                    | ❌           |getAccessoriesByBrand      | User
| GET    | `/priceRange`    | Get accessories by Price Range   | -                    | ❌           |getAccessoriesByPriceRange | User



# User-Admin Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/admin`

| Method | Endpoint         | Description                      | Request Type          | Image Upload   |  API Name  |  ADMIN/USER
|--------|------------------|----------------------------------|-----------------------|----------------|------------|--------------
| GET    | `/all`           | Get all users                    | -                     | ❌            |getAllUsers | Admin
| GET    | `/:userId`       | Get user by ID                   | -                     | ❌            |getUserById | Admin
| PATCH  | `/:userId`       | Update user                      | -                     | ❌            |updateUser  | Admin
| DELETE | `/:userId`       | Delete user                      | -                     | ❌            |deleteUser  | Admin



# User Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/user`

| Method | Endpoint         | Description                      | Request Type          | Image Upload   |  API Name     |  ADMIN/USER
|--------|------------------|----------------------------------|-----------------------|----------------|---------------|--------------
| GET    | `/`              | Get user by ID                   | -                     | ❌            |getUserProfile | User
| PATCH  | `/`              | Update user                      | `multipart/form-data` | ✅ `"image"`  |updateUser     | User
| DELETE | `/`              | Delete user                      | -                     | ❌            |deleteUser     | User


# Product Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/product`

| Method | Endpoint               | Description                 | Request Type      | Image Upload | API Name            | ADMIN/USER |
|--------|------------------------|-----------------------------|-------------------|--------------|---------------------|------------|
| GET    | `/getTrendingProducts` | Get top trending products   | Query: `?limit=5` | ❌           | getTrendingProducts | User       |
| GET    | `/getRandomProducts`   | Get random products         | Query: `?limit=5` | ❌           | getRandomProducts   | User       |


# Notifcation and Subscription Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/notification`

| Method | Endpoint                     | Description                              | Request Type      | Image Upload | API Name                 | ADMIN/USER |
|--------|------------------------------|------------------------------------------|-------------------|--------------|--------------------------|------------|
| POST   | `/create`                    | Create a new notification                | JSON              | ❌           | createNotification       | Admin      |
| POST   | `/sendAll`                   | Send notification to all users           | JSON              | ❌           | sendNotificationToAll    | Admin      |
| GET    | `/all`                       | Get all notifications                    | -                 | ❌           | getAllNotifications      | Admin/User |
| GET    | `/:id`                       | Get a specific notification by ID        | -                 | ❌           | getNotificationById      | Admin/User |
| PUT    | `/:id`                       | Update a specific notification by ID     | JSON              | ❌           | updateNotification       | Admin      |
| DELETE | `/:id`                       | Delete a specific notification by ID     | -                 | ❌           | deleteNotification       | Admin      |
| POST   | `/saveSubscription`          | Save a user's push subscription          | JSON              | ❌           | saveSubscription         | User       |
| GET    | `/getSubscription/:userId`   | Get a user's saved push subscriptions    | -                 | ❌           | getUserSubscriptions     | Admin/User |

# Search Route API – Valsco LensKart

### Base URL: `http://localhost:5000/search`

| Method | Endpoint        | Description                          | Request Type     | Image Upload | API Name        | ADMIN/USER |
|--------|------------------|--------------------------------------|------------------|--------------|-----------------|------------|
| GET    | `/products`      | Search products by name, brand, etc. | Query: `?query=rayban` | ❌       | searchProducts  | User/Admin |


# Order Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/order`

| Method | Endpoint                    | Description                              | Request Type          | Image Upload | API Name              | ADMIN/USER |
|--------|-----------------------------|------------------------------------------|----------------------|--------------|-----------------------|------------|
| POST   | `/`                         | Create new order                         | JSON                 | ❌           | createOrder           | User       |
| GET    | `/`                         | Get all orders for user                  | -                    | ❌           | getOrdersByUser       | User       |
| GET    | `/:id`                      | Get order by ID                          | -                    | ❌           | getOrderById          | User       |
| PATCH  | `/:id/cancel`               | Cancel order by ID                       | -                    | ❌           | cancelOrder           | User       |
| GET    | `/track/:orderNumber`       | Track order by order number              | -                    | ❌           | trackOrder            | User       |
| GET    | `/admin/all`                | Get all orders (admin)                   | -                    | ❌           | getAllOrders          | Admin      |
| PATCH  | `/:id/status`               | Update order status                      | JSON                 | ❌           | updateOrderStatus     | Admin      |
| PATCH  | `/:id/payment`              | Update payment status for order          | JSON                 | ❌           | updatePaymentStatus   | Admin      |
| PATCH  | `/:id/tracking`             | Add tracking info to order               | JSON                 | ❌           | addTrackingInfo       | Admin      |


# Cart Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/api/cart`

All cart routes require a user to be authenticated via a session cookie.

| Method | Endpoint | Description                      | Request Type | API Name             |
| :----- | :------- | :------------------------------- | :----------- | :------------------- |
| `POST` | `/add`   | Add an item to the user's cart   | JSON         | `addToCart`          |
| `GET`  | `/`      | Get the logged-in user's cart    | -            | `getCart`            |
| `PUT`| `/update`| Update an item's quantity        | JSON         | `updateItemQuantity` |
| `DELETE`| `/item`  | Remove a specific item from cart | JSON         | `removeFromCart`     |
| `DELETE`| `/`      | Clear the entire user's cart     | -            | `clearCart`          |