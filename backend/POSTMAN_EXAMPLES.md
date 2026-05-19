# Postman API Test Examples

Base URL: `http://localhost:5000`

---

## 1. Health Check

**GET** `http://localhost:5000/api/health`

No headers required.

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Smart Complaint Management API is running",
  "timestamp": "2026-05-19T10:00:00.000Z"
}
```

---

## 2. User Signup

**POST** `http://localhost:5000/api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Admin Signup Example:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. User Login

**POST** `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> Copy the `token` from signup/login response for protected routes below.

---

## 4. Create Complaint (Protected)

**POST** `http://localhost:5000/api/complaints`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Body (raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Street Light Not Working",
  "description": "The street light near block A has been off for 3 days.",
  "category": "Infrastructure",
  "location": "Block A, Sector 12"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0e",
    "name": "John Doe",
    "email": "john@example.com",
    "title": "Street Light Not Working",
    "description": "The street light near block A has been off for 3 days.",
    "category": "Infrastructure",
    "location": "Block A, Sector 12",
    "status": "Pending",
    "createdAt": "2026-05-19T10:05:00.000Z",
    "updatedAt": "2026-05-19T10:05:00.000Z"
  }
}
```

---

## 5. Get All Complaints (Protected)

**GET** `http://localhost:5000/api/complaints`

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": {
    "count": 1,
    "complaints": [
      {
        "_id": "665f1a2b3c4d5e6f7a8b9c0e",
        "name": "John Doe",
        "email": "john@example.com",
        "title": "Street Light Not Working",
        "status": "Pending",
        "location": "Block A, Sector 12"
      }
    ]
  }
}
```

---

## 6. Search Complaints by Location (Protected)

**GET** `http://localhost:5000/api/complaints/search?location=Sector 12`

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Complaints search completed successfully",
  "data": {
    "count": 1,
    "complaints": []
  }
}
```

---

## 7. Update Complaint (Admin Only)

**PUT** `http://localhost:5000/api/complaints/<COMPLAINT_ID>`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Body (raw JSON):**
```json
{
  "status": "In Progress",
  "description": "Team assigned to fix the street light."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Complaint updated successfully",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0e",
    "status": "In Progress"
  }
}
```

---

## 8. Delete Complaint (Admin Only)

**DELETE** `http://localhost:5000/api/complaints/<COMPLAINT_ID>`

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Complaint deleted successfully"
}
```

---

## Error Examples

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized. No token provided"
}
```

### Forbidden - Non-admin update/delete (403)
```json
{
  "success": false,
  "message": "Role 'user' is not authorized for this action"
}
```

---

## Postman Environment Variables (Recommended)

| Variable   | Value                      |
|-----------|----------------------------|
| base_url  | http://localhost:5000      |
| token     | (set after login)          |
| complaint_id | (set after create)     |

Use `{{base_url}}/api/auth/login` and set `token` from Tests tab:
```javascript
const json = pm.response.json();
pm.environment.set("token", json.data.token);
```
