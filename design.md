# Design Specification — Student Expense Tracker

## Design Direction
Clean, friendly, minimal, student-focused, and mobile-first.

## Layout
### Desktop
- Centered application container
- Maximum width around 1100–1200px
- Header with app name and navigation
- Dashboard cards in a responsive grid
- Two-column layout for summary and category breakdown
- Full-width recent transaction list

### Mobile
- Single-column layout
- Compact header
- Large primary **Add Expense** button
- Summary cards stacked vertically
- Category breakdown below summary
- Recent transactions below the chart

## Visual Hierarchy
1. Total spent this month
2. Remaining budget
3. Add Expense action
4. Category breakdown
5. Recent transactions

## Components
- Header
- SummaryCard
- BudgetProgress
- CategoryBreakdown
- AddExpenseModal/Form
- TransactionList
- TransactionRow
- EmptyState
- Toast/notification
- CategoryBadge

## Suggested Style
- Background: very light neutral
- Cards: white with subtle border and shadow
- Primary action: blue or indigo
- Success: green
- Warning: amber
- Error: red
- Text: dark neutral
- Border radius: 12–16px
- Buttons: 10–12px radius
- Use a modern sans-serif font

## Accessibility
- Minimum readable body text around 16px
- Strong color contrast
- Visible keyboard focus
- Labels for every input
- Buttons must have clear text or accessible labels
- Do not rely only on color to communicate warnings

## Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640–1024px
- Desktop: > 1024px

## Dashboard Example
Header
↓
“Good afternoon 👋”
↓
[Monthly Budget] [Spent] [Remaining]
↓
[Budget Progress]
↓
[Where Your Money Went]
Category breakdown
↓
[Recent Expenses]
Transaction list
↓
[+ Add Expense]

## UX Tone
Friendly and non-judgmental. Avoid language that makes students feel guilty about spending.
