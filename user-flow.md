# 🔄 User Flow & Journey Maps

## 1. Visitor Flow (Non-Authenticated Discovery)
```
Landing Page 
  ├──> Views Public Hero & National Student Spending Benchmarks
  ├──> Reads Live AI Savings & Micro-expense Tips
  ├──> Explores Dashboard in Guest Mode (No signup required)
  └──> One-Click Options:
        ├── Continue exploring in Guest Demo Mode
        └── Click "Sign Up Free" -> Modal -> Creates MongoDB Atlas Account
```

---

## 2. Authenticated Student Flow
```
Open App
  ├──> Log In with Email & Password (or Sign Up)
  ├──> Dashboard renders real-time MongoDB data:
  │     ├── Monthly Pocket Budget
  │     ├── Total Spent & Remaining Balance
  │     ├── Safe Daily Spending Allowance
  │     ├── Budget Health Status (Normal / 80% Alert / Exceeded)
  │     ├── AI Health Audit & Recommendations
  │     └── Category Breakdown Chart (Chart.js)
  │
  ├──> Adding an Expense:
  │     ├── Fast Route: Type casual text in "AI Fast Logger" -> Instant save
  │     └── Form Route: Click "+ Add Expense" -> Modal -> Select Category & Save
  │
  ├──> Interacting with AI Coach:
  │     ├── Click quick prompt chips (e.g. "Save ₹1,000", "50/30/20 Rule")
  │     └── Type custom financial questions -> Get tailored guidance
  │
  └──> Budget Adjustment:
        └── Click "Set Monthly Budget" -> Enter amount or pick preset -> Live update
```
