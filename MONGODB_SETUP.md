# 🍃 MongoDB Atlas Configuration & Connection Guide

This guide walks you through connecting your MongoDB Atlas cluster (`Cluster0`) to **Expenz AI**.

---

## 1. Access Your MongoDB Atlas Cluster
Your MongoDB Cluster Dashboard:
👉 **[MongoDB Atlas Cluster Connect](https://cloud.mongodb.com/v2/6ac4b0a347f9232cf2c7b430#/clusters/connect?clusterId=Cluster0)**

---

## 2. Step-by-Step Connection Instructions

### Step A: Configure Network Access (IP Whitelist)
1. In the left navigation menu of MongoDB Atlas, click **Network Access** (under Security).
2. Click **+ Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**. *(This allows your local machine and hosting server to connect without IP blocking)*.

### Step B: Create a Database User
1. In the left navigation menu, click **Database Access**.
2. Click **+ Add New Database User**.
3. Choose **Password** Authentication Method:
   - **Username**: `admin` (or your chosen username)
   - **Password**: `YourSecurePassword123` (Note down this password)
4. Under **Database User Privileges**, select **Read and write to any database** (Atlas Admin or Built-in Role).
5. Click **Add User**.

### Step C: Retrieve the Connection String (URI)
1. Go back to **Database** -> **Clusters**.
2. Find `Cluster0` and click the **Connect** button.
3. Choose **Drivers** (Node.js).
4. Select Driver: `Node.js`, Version: `6.0 or later`.
5. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.p1bcf.mongodb.net/?retryWrites=true&w=majority
   ```

### Step D: Update `.env` in the Project
Open the `.env` file in `a:\hackthon\hackathon\.env` and paste your string:

```env
# Server Port
PORT=5000
NODE_ENV=development

# Paste your MongoDB Atlas URI here (replace <username> and <password> with your database user)
MONGODB_URI=mongodb+srv://admin:YourSecurePassword123@cluster0.p1bcf.mongodb.net/expense_tracker?retryWrites=true&w=majority

# JWT Authentication Secret
JWT_SECRET=super_secret_jwt_key_student_expense_tracker_2026
```

---

## 3. Verifying the Connection

1. Start or restart your server:
   ```bash
   npm start
   ```
2. You will see the confirmation log in your terminal:
   ```
   ✅ [MongoDB Atlas] Database Connected successfully: cluster0-shard-00-00.p1bcf.mongodb.net
   ====================================================
   🚀 Expenz AI Student Expense Tracker is running!
   🌐 Local Web URL: http://localhost:5000
   🍃 Database: MongoDB Atlas (Cluster0)
   ====================================================
   ```
3. Open `http://localhost:5000` in your browser.
4. The top navigation pill will show 🟢 **MongoDB Atlas (Cluster0)** in real-time.

---

## 4. Collections Created Automatically

When users sign up and log expenses, Mongoose creates two collections in your `expense_tracker` database:
- **`users`**: Stores user profiles, hashed passwords, currency, and monthly budget allowance.
- **`expenses`**: Stores transaction amounts, categories, notes, dates, payment methods, and AI tags.

---

## 5. Built-in Resilient Fallback

If network connectivity is temporarily unavailable or credentials have not yet been inserted, the server automatically provides built-in in-memory fallback so you can continue testing all features (Public mode, Guest mode, AI natural language parsing, and visual analytics) smoothly without crashes!
