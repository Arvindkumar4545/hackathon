# Prompt for Creating the Project

Copy and paste the following prompt into an AI coding assistant:

> Build a complete responsive web application called **Student Expense Tracker**.
>
> ## Problem
> Students often receive pocket money but forget where it went by the end of the month. Small purchases such as food, transport, entertainment, shopping, and stationery add up, but students do not have a simple way to see where their money was spent.
>
> ## Goal
> Create a simple, friendly, mobile-first expense tracker that lets a student record expenses quickly and immediately understand their spending.
>
> ## Required MVP Features
> 1. Set a monthly pocket-money budget.
> 2. Add an expense with:
>    - amount
>    - category
>    - optional note
>    - date
> 3. Show dashboard cards for:
>    - monthly budget
>    - total spent this month
>    - remaining money
> 4. Show a visual budget-progress indicator.
> 5. Show category-wise spending for the current month.
> 6. Show recent expenses.
> 7. Allow an expense to be deleted.
> 8. Show useful empty states.
> 9. Show a warning when spending reaches 80% of the monthly budget.
> 10. Show an exceeded-budget state when spending passes the budget.
> 11. Store the MVP data in browser LocalStorage so no backend is required.
>
> ## Categories
> Food, Transport, Education, Entertainment, Shopping, Other.
>
> ## Design
> - Clean and professional student-focused UI.
> - Mobile-first responsive design.
> - Light neutral background.
> - White cards with subtle borders and shadows.
> - Rounded corners.
> - Modern sans-serif typography.
> - Use one clear primary accent color.
> - Make the Add Expense button highly visible.
> - Keep the interface friendly and non-judgmental.
> - Follow basic accessibility practices.
>
> ## Main User Flow
> Open app → set monthly budget → dashboard → add expense → choose category → save → dashboard updates → view category breakdown and recent transactions.
>
> ## Technical Requirements
> For the MVP use:
> - HTML5
> - CSS3
> - Vanilla JavaScript
> - LocalStorage
>
> Organize the project as:
> - index.html
> - style.css
> - app.js
> - solution.md
> - user-flow.md
> - design.md
> - idea-origin.md
> - documentation.md
> - PROJECT_PROMPT.md
>
> ## Data Model
> Expense:
> `{ id, amount, category, note, date }`
>
> Budget:
> `{ monthlyBudget }`
>
> ## Quality Requirements
> - Validate form inputs.
> - Escape user-entered text before inserting it into HTML.
> - Use semantic HTML.
> - Make all interactive controls keyboard accessible.
> - Make the layout responsive for mobile, tablet, and desktop.
> - Keep JavaScript readable and modular.
> - Do not require a backend.
> - Do not add unnecessary features that make the MVP complicated.
>
> ## Deliverables
> Provide all source code and documentation. The application should run by opening `index.html` in a browser.
>
> ## Product Principle
> **“Record it quickly. Understand it instantly.”**
