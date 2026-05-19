# AI-Based Smart Complaint Management System — Backend API

Production-ready REST API built with Node.js, Express, MongoDB, and JWT authentication.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs, dotenv, cors, express-validator

## Project Structure

```
backend/
├── config/          # Database connection
├── controllers/     # Request handlers
├── middleware/      # Auth, validation, errors
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helpers (asyncHandler, tokens, etc.)
├── validators/      # express-validator rules
├── app.js           # Express app setup
├── server.js        # Entry point
└── package.json
```

## Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI

## Setup

1. **Navigate to the backend folder:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your values:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/smart_complaint_db
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the server:**

   ```bash
   npm run dev
   ```

   API base URL: `http://localhost:5000`

## API Endpoints

### Auth (Public)

| Method | Endpoint           | Description      |
|--------|--------------------|------------------|
| POST   | `/api/auth/signup` | Register user    |
| POST   | `/api/auth/login`  | Login & get JWT  |

### Complaints (Protected — Bearer token required)

| Method | Endpoint                        | Description              | Role   |
|--------|---------------------------------|--------------------------|--------|
| POST   | `/api/complaints`               | Create complaint         | User   |
| GET    | `/api/complaints`               | List all complaints      | User   |
| PUT    | `/api/complaints/:id`           | Update complaint         | Admin  |
| DELETE | `/api/complaints/:id`           | Delete complaint         | Admin  |
| GET    | `/api/complaints/search?location=` | Search by location  | User   |

### Health

| Method | Endpoint      | Description |
|--------|---------------|-------------|
| GET    | `/api/health` | Health check |

## Authentication

Include the JWT in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

## Sample Requests

### Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Complaint

```http
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Water supply issue",
  "description": "No water supply for 3 days in sector 5",
  "category": "Utilities",
  "location": "Sector 5, Delhi"
}
```

### Search by Location

```http
GET /api/complaints/search?location=Delhi
Authorization: Bearer <token>
```

## Postman Testing

- Import `Smart_Complaint_API.postman_collection.json` into Postman
- Or follow step-by-step examples in `POSTMAN_EXAMPLES.md`

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm start`   | Run in production mode   |
| `npm run dev` | Run with nodemon (dev)   |

## Response Format

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ { "field": "email", "message": "..." } ]
}
```
