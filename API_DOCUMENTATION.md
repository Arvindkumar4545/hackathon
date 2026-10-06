# 📡 REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Public Endpoints (No Authentication Required)

### `GET /api/public/overview`
Retrieves public student spending benchmarks, habit tips, and feature highlights for landing page visitors without login.

**Response:**
```json
{
  "success": true,
  "platform": "Expenz AI - Student Smart Expense Tracker",
  "databaseStatus": {
    "connected": true,
    "cluster": "Cluster0",
    "engine": "MongoDB Atlas Cloud"
  },
  "publicBenchmarks": {
    "avgMonthlyPocketMoney": 6000,
    "avgMonthlySpent": 4350,
    "avgSavingsRate": "27.5%",
    "topSpendingCategories": [
      { "category": "Food & Canteen", "percentage": 38, "avgAmount": 1650, "icon": "🍔" },
      { "category": "Education & Books", "percentage": 22, "avgAmount": 950, "icon": "📚" }
    ],
    "studentHabitsInsight": [
      "Students who track daily expenses save 2.4x more pocket money each month."
    ]
  }
}
```

### `GET /api/public/status`
Checks MongoDB Atlas connectivity and cluster name.

---

## 2. Authentication Endpoints

### `POST /api/auth/signup`
Registers a new student account and returns a JWT token.

**Request Body:**
```json
{
  "name": "Rahul Verma",
  "email": "rahul@college.edu",
  "password": "password123",
  "monthlyBudget": 6000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student account registered successfully in MongoDB Atlas!",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "651f...",
    "name": "Rahul Verma",
    "email": "rahul@college.edu",
    "monthlyBudget": 6000,
    "currency": "INR"
  }
}
```

### `POST /api/auth/login`
Authenticates an existing student.

**Request Body:**
```json
{
  "email": "rahul@college.edu",
  "password": "password123"
}
```

### `POST /api/auth/guest`
Instant one-click demo session with sample transactions without requiring email/password.

### `PUT /api/auth/budget` (Private, Requires `Bearer <token>`)
Updates the student's monthly budget limit.

**Request Body:**
```json
{
  "monthlyBudget": 7500
}
```

---

## 3. Expense Management Endpoints (Requires `Bearer <token>`)

### `GET /api/expenses`
Retrieves expenses for the logged-in student. Supports optional query parameters:
- `?month=YYYY-MM` (e.g. `?month=2026-10`)
- `?category=Food`
- `?search=canteen`

### `POST /api/expenses`
Creates a new expense transaction.

**Request Body:**
```json
{
  "amount": 180,
  "category": "Food",
  "note": "College canteen lunch & tea",
  "date": "2026-10-06",
  "paymentMethod": "UPI",
  "isAiSuggested": false
}
```

### `DELETE /api/expenses/:id`
Deletes a specific expense transaction by ID.

### `GET /api/expenses/stats`
Computes monthly summary analytics: total spent, remaining balance, percentage used, daily average, projected month-end total, and category breakdown.

---

## 4. AI Engine Endpoints

### `POST /api/ai/parse`
Parses natural language casual text into a structured transaction JSON.

**Request Body:**
```json
{
  "text": "Spent 350 on Dominos pizza with friends yesterday via UPI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 350,
    "category": "Food",
    "note": "Dominos pizza with friends",
    "date": "2026-10-05",
    "paymentMethod": "UPI",
    "confidence": 0.95
  }
}
```

### `POST /api/ai/insights`
Calculates Financial Health Score (0-100), safe daily spending allowance, and custom recommendations.

### `POST /api/ai/chat`
Interactive student financial coach for budgeting advice, 50/30/20 pocket money rules, and canteen savings tips.
