# User Flow — Student Expense Tracker

## Main Goal
Help a student record pocket-money spending and understand where the money went.

## Flow 1: First Visit
Start
→ Open app
→ See welcome/dashboard
→ Set monthly pocket-money budget
→ Dashboard displays budget = amount entered
→ Add first expense

## Flow 2: Add Expense
Dashboard
→ Tap **Add Expense**
→ Enter amount
→ Choose category
→ Add optional note
→ Confirm
→ Expense is saved
→ Dashboard totals update
→ Recent transaction appears

## Flow 3: Check Where Money Went
Dashboard
→ View total spent
→ View remaining budget
→ View category breakdown
→ Select a category
→ See transactions in that category

## Flow 4: Review History
Dashboard
→ Open **Transactions**
→ View recent expenses
→ Filter by category
→ Review amount/date/note
→ Delete incorrect transaction
→ Totals update automatically

## Flow 5: Budget Warning
Dashboard
→ Spending reaches 80% of budget
→ Show warning
→ Spending reaches 100%
→ Show budget exceeded state
→ User can continue recording expenses while seeing the negative/zero remaining balance

## Navigation
- Dashboard
- Add Expense
- Transactions
- Settings/Budget

## Empty State
If no expenses exist:
“Your spending will appear here. Add your first expense to start tracking.”

## Error States
- Amount missing: “Enter an amount.”
- Amount is zero/negative: “Enter an amount greater than 0.”
- Category missing: “Choose a category.”
- Invalid budget: “Enter a valid monthly budget.”

## UX Principle
The app should require as few taps and fields as possible. The student should understand the spending summary immediately after opening the app.
