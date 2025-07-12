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
