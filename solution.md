# 💡 Solution Design & Architecture

## The Problem
Students often receive monthly pocket money from parents or part-time earnings, but find themselves broke before the month ends. The primary drivers are:
1. **Friction in Manual Logging:** Existing finance apps are complex, designed for salaried adults with taxes and investments.
2. **Hidden Micro-Expenses:** Small ₹30–₹100 canteen UPI transactions accumulate invisibly.
3. **Lack of Instant Feedback:** Students don't know their "safe daily spend limit" for the remaining days of the month.

---

## The Expenz AI Solution
Expenz AI delivers a purpose-built student financial tracker that eliminates friction and delivers immediate clarity:

1. **AI Natural Language Entry:** Instead of filling multiple form dropdowns, students can type or paste *"Paid 180 for canteen biryani yesterday via UPI"* and log it in 3 seconds.
2. **Immediate Public Value:** Visitors get instant spending benchmarks, habit tips, and sandbox simulation without mandatory sign-up.
3. **MongoDB Atlas Multi-Device Cloud Sync:** Real-time persistence linked to MongoDB Atlas Cluster0.
4. **Dynamic 80% & 100% Budget Guardrails:** Visual color shifting (Green → Amber → Red) with explicit overdraft metrics.
5. **AI Financial Health Coach:** Real-time 0-100 scoring, safe daily allowance calculations, and smart category suggestions.

---

## Tech Stack
- **Frontend:** HTML5, CSS3 (Pure White Luxe Design System), Vanilla JS (ES6+), Chart.js
- **Backend:** Node.js, Express 5.x REST API
- **Database:** MongoDB Atlas (`Cluster0`) with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) + Bcrypt Password Encryption
- **Intelligence:** Heuristic NLP Parser + AI Financial Health & Chat Engine
