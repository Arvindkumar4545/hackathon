# 🎓 Expenz AI · Student Smart Expense Tracker

> **"Record it quickly. Understand it instantly."**
> A modern, AI-powered pocket-money management web application with **MongoDB Atlas Cloud persistence**, pure-white minimalist UX design, intelligent spending diagnostics, and full **public exploration without mandatory login**.

---

## 🌟 Key Highlights

- 🍃 **MongoDB Atlas Cloud Sync:** Connects directly to your MongoDB Atlas cluster (`Cluster0`) with resilient automatic fallback.
- 🔓 **Public Non-Authenticated Mode:** Visitors can explore average student spending benchmarks, interactive features, and live simulation sandboxes without logging in or signing up.
- 🔐 **JWT User Authentication:** Complete Sign Up, Log In, Guest Demo session, and user profile management with bcrypt password encryption.
- ✨ **AI Natural Language Fast Logger:** Type or paste phrases like *"Spent 350 on Dominos pizza with friends yesterday via UPI"* and AI instantly extracts amount, category, date, payment method, and clean note.
- 🤖 **AI Financial Health Coach:** Real-time financial health score (e.g. 94/100), automated safe daily spend limits, 50/30/20 budget allocations, and conversational financial advisor.
- 🎨 **Pure White Luxe Design System:** Crisp, distraction-free pure white interface with subtle borders, refined glass card elevation, smooth Chart.js visualizations, and mobile-first responsiveness.
- 🚨 **Dynamic Budget Alerts:** Automatic warning pills and progress bar color transitions when reaching **80%** threshold and when **budget is exceeded**.
- 🎓 **Campus Choice Lab:** Compare recurring student-life choices by their full-semester cost and see how the difference could move a saved goal closer.
- 🧾 **Campus Bill Splitter:** Calculate each student's fair share, track whether friends owe you, and add only your portion to expenses.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0 or newer
- **MongoDB Atlas** Account (or local MongoDB)

### 2. Installation
Clone the repository and install dependencies:
```bash
# Navigate to the project directory
cd hackathon

# Install required dependencies
npm install
```

### 3. Environment Configuration
Create or edit your `.env` file in the project root:
```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String
# Replace <username> and <password> with your Atlas Database User credentials
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/expense_tracker?retryWrites=true&w=majority

# JWT Authentication Secret
JWT_SECRET=super_secret_jwt_key_student_expense_tracker_2026
```

### 4. Start the Application
```bash
npm start
# or for development mode:
npm run dev
```

Open your browser and visit: **[http://localhost:5000](http://localhost:5000)**

---

## 🍃 MongoDB Atlas Connection Setup

To connect your MongoDB Atlas Cluster (`Cluster0`):

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Click on **Database Access** -> **Add New Database User** (create username & password).
3. Click on **Network Access** -> **Add IP Address** -> Choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
4. Go to **Database** -> Click **Connect** on `Cluster0` -> Choose **Drivers (Node.js)**.
5. Copy the connection string and paste it into your `.env` file under `MONGODB_URI`.
6. Replace `<username>` and `<password>` with the credentials you created in Step 2.
7. Restart the server (`npm start`). The green indicator in the navigation bar will show **MongoDB Atlas (Cluster0)**!

> 💡 *Note: If MongoDB Atlas credentials are not entered yet, the application automatically runs in resilient demo/memory fallback mode so all features and UI work seamlessly without errors.*

---

## 📚 Project Structure

```
├── .env                  # Environment secrets & database URI
├── .env.example          # Environment template
├── config/
│   └── db.js             # Resilient MongoDB Atlas connection manager
├── models/
│   ├── User.js           # User schema with bcrypt encryption
│   └── Expense.js        # Transaction schema with categories & AI tags
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   ├── auth.js           # Signup, Login, Guest mode, Profile & Budget API
│   ├── expenses.js       # Expense CRUD, filters, and statistics calculation
│   ├── public.js         # Non-authenticated overview & benchmark data
│   └── ai.js             # AI NLP parser, Financial Health Audit & Coach Chat
├── public/               # Static assets
├── index.html            # Single-page modern pure white UI
├── style.css             # Pure White Luxe CSS design system
├── app.js                # Frontend client controller & Chart.js integration
├── server.js             # Express.js HTTP application server
├── MONGODB_SETUP.md      # Detailed step-by-step MongoDB setup guide
├── API_DOCUMENTATION.md  # Complete REST API reference
└── documentation.md      # Architecture, security & workflows
```

---

## 🤖 AI Features Overview

| Feature | Description | Endpoint |
|---|---|---|
| **AI Natural Language Fast Logger** | Converts casual student descriptions into structured transactions automatically. | `POST /api/ai/parse` |
| **Financial Health Audit** | Computes Health Score (0-100), safe daily allowance, and burn-rate warnings. | `POST /api/ai/insights` |
| **AI Student Financial Coach** | Interactive chat coach answering questions on savings, 50/30/20 rules & canteen optimization. | `POST /api/ai/chat` |

---

## 📜 License
MIT License. Built for student financial clarity.