# Build & Documentation — Student Expense Tracker

## Project Name
Student Expense Tracker

## Recommended Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage

This stack keeps the project simple and easy to run for a student project/demo.

## Folder Structure

```text
student-expense-tracker/
├── index.html
├── style.css
├── app.js
├── solution.md
├── user-flow.md
├── design.md
├── idea-origin.md
└── documentation.md
```

## Data Model

Each expense:

```js
{
  id: "unique-id",
  amount: 120,
  category: "Food",
  note: "Lunch",
  date: "2026-10-06"
}
```

Budget:

```js
{
  monthlyBudget: 5000
}
```

## LocalStorage Keys
- `student_expenses`
- `student_budget`

## Main Calculations
### Total Spent
Sum all expense amounts for the current month.

### Remaining
`monthlyBudget - totalSpent`

### Category Total
Group current-month expenses by category and sum their amounts.

### Budget Percentage
`(totalSpent / monthlyBudget) * 100`

## Running the Project
1. Put `index.html`, `style.css`, and `app.js` in one folder.
2. Open `index.html` in a browser.
3. No server or database is required for the MVP.

For development, VS Code with Live Server can also be used.

## Testing Checklist
- Add a valid expense.
- Try submitting without an amount.
- Try zero and negative amounts.
- Try submitting without a category.
- Confirm totals update.
- Confirm budget remaining updates.
- Confirm category totals update.
- Delete an expense.
- Refresh the page and confirm data remains.
- Test the layout on a narrow mobile viewport.
- Test when there are no transactions.
- Test when the budget is exceeded.

## Future Architecture
For a production version:
Frontend → React/Next.js
Backend → Node.js/Express or Supabase
Database → PostgreSQL/Supabase
Authentication → Supabase Auth
Charts → Recharts/Chart.js
Deployment → Vercel/Netlify

## Privacy
The MVP stores data locally in the browser. Do not collect personal information unnecessarily.

## Definition of Done
The project is complete when a student can:
1. Set a monthly budget.
2. Add expenses.
3. See total spending.
4. See remaining money.
5. See category-wise spending.
6. Review transactions.
7. Delete transactions.
8. Refresh the page without losing locally stored data.
9. Use the application comfortably on mobile.
