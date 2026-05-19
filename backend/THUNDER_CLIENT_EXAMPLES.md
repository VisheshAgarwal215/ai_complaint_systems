# Thunder Client — AI API Test Examples

Base URL: `http://localhost:5000`

> **Prerequisite:** Obtain a JWT by logging in via `POST /api/auth/login`, then use it in the `Authorization` header for protected AI routes.

---

## 1. Login (get JWT token)

**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Save from response:** `data.token`

---

## 2. AI Analyze Complaint

**Method:** `POST`  
**URL:** `http://localhost:5000/api/ai/analyze`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <paste_token_here>
```

**Body (JSON):**
```json
{
  "title": "No water supply for 3 days",
  "description": "Our entire apartment block in Sector 5 has had no water supply for 3 consecutive days. Residents including elderly people are struggling. Please resolve urgently.",
  "category": "Utilities"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Complaint analyzed successfully",
  "data": {
    "priority": "High",
    "department": "Water & Sanitation",
    "summary": "Prolonged water outage affecting an entire apartment block in Sector 5 with vulnerable residents impacted.",
    "autoResponse": "Thank you for reporting this issue. We understand how disruptive a multi-day water outage is, especially for elderly residents. Your complaint has been logged and escalated to the Water & Sanitation department for immediate review. Our team will investigate the supply disruption in Sector 5 and coordinate restoration efforts. We appreciate your patience and will update you as soon as we have more information."
  }
}
```

---

## 3. AI Analyze — Medium Priority Example

**Method:** `POST`  
**URL:** `http://localhost:5000/api/ai/analyze`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <paste_token_here>
```

**Body (JSON):**
```json
{
  "title": "Broken streetlight on Main Road",
  "description": "The streetlight near bus stop 12 has been broken for two weeks, making the area dark and unsafe at night.",
  "category": "Infrastructure"
}
```

---

## 4. AI Analyze — Low Priority Example

**Method:** `POST`  
**URL:** `http://localhost:5000/api/ai/analyze`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <paste_token_here>
```

**Body (JSON):**
```json
{
  "title": "Graffiti on park bench",
  "description": "Someone spray-painted graffiti on a bench in Central Park. Not urgent but looks unpleasant.",
  "category": "Maintenance"
}
```

---

## 5. Validation Error (missing fields)

**Method:** `POST`  
**URL:** `http://localhost:5000/api/ai/analyze`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <paste_token_here>
```

**Body (JSON):**
```json
{
  "title": "",
  "description": "",
  "category": ""
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "description", "message": "Description is required" },
    { "field": "category", "message": "Category is required" }
  ]
}
```

---

## 6. Unauthorized (no token)

**Method:** `POST`  
**URL:** `http://localhost:5000/api/ai/analyze`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Test",
  "description": "Test description",
  "category": "General"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Not authorized. No token provided"
}
```

---

## Thunder Client Collection Tips

1. Create an **Environment** variable: `baseUrl` = `http://localhost:5000`
2. Create an **Environment** variable: `token` = (paste after login)
3. Use `{{baseUrl}}/api/ai/analyze` as the request URL
4. Set Authorization header to: `Bearer {{token}}`
