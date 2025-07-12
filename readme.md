Valsco Backend LensKart

# Frame Routes API – Valsco LensKart

### Base URL: `http://localhost:5000/frame`
### Auth (Admin)
| Method | Endpoint         | Description                      | Request Type         |  Image Upload |
|--------|------------------|----------------------------------|----------------------|-------------- |
| POST   | `/create`        | Create new frame + product       | `multipart/form-data`| ✅ `"file"`  |
| GET    | `/all`           | Get all frames                   | -                    | ❌           |
| GET    | `/:id`           | Get frame by ID                  | -                    | ❌           |
| PUT    | `/:id`           | Update frame + product info      | `multipart/form-data`| ✅ `"image"` |
| DELETE | `/:id`           | Delete frame + image             | -                    | ❌           |
