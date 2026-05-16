# Finance Dashboard

Zorvyn Finance Dashboard is a lightweight fintech-style web application built with HTML, CSS, and vanilla JavaScript. It helps users track transactions, monitor balance trends, review category spending, and explore financial insights through a polished, responsive dashboard experience.

## Project Overview

This project was designed as a modern personal finance dashboard with a strong focus on usability, visual polish, and interactive feedback. The goal was to create something that feels closer to a real product than a basic CRUD demo while still keeping the stack simple and framework-free.

The dashboard includes transaction management, analytics, role-based interaction, persistent local state, CSV export, and multiple chart-based financial views.

## What This Project Demonstrates

- Building a complete dashboard interface using only HTML, CSS, and JavaScript
- Managing application state with arrays, objects, and `localStorage`
- Creating a responsive, polished UI without frameworks
- Handling real user interactions like filtering, searching, editing, deleting, and exporting data
- Turning raw transaction data into useful financial summaries and insights

## Core Features

- Add, edit, and delete transactions
- Dashboard summary cards for:
  - Total Balance
  - Total Income
  - Total Expenses
  - Savings Rate
- Savings goal tracker with animated progress bar
- Balance trend line chart
- Spending by category doughnut chart
- Monthly income vs expense bar chart
- Search, filter, and sort transactions
- CSV export for transaction history
- Smart insight cards based on transaction data
- Role-based UI with Admin and Viewer modes
- Display currency selector for symbol-based currency preference
- Dark mode support
- Toast notifications and polished UI feedback

## Advanced UX Enhancements

- Inline transaction editing with Save and Cancel actions
- Delete confirmation modal for safer user actions
- Empty-state handling for no data and filtered-no-result scenarios
- Animated total balance updates when transactions are added
- Styled chart legend with category amount and percentage
- Highlighting for important financial rows such as major expenses and income
- Viewer read-only banner with disabled admin controls

## Charts and Analytics

The dashboard uses Chart.js to visualize financial activity:

- Line chart for balance trend over time
- Doughnut chart for expense distribution by category
- Bar chart for monthly income versus expenses

Insights are calculated dynamically from transaction data, including:

- Highest spending category
- Spending change versus last month
- Top expense categories
- Savings rate

## Role-Based Experience

### Admin

- Can add transactions
- Can edit existing transactions
- Can delete transactions
- Can export transaction data to CSV

### Viewer

- Read-only access
- Form controls are disabled
- Banner indicates read-only mode

## State Management

The application uses JavaScript objects and arrays for in-memory state, with persistence handled through `localStorage`.

Stored items include:

- Transactions
- Selected role
- Theme preference
- Display currency
- Savings goal
- Filter selections

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js
- Font Awesome
- Google Fonts (Inter)

## Project Structure

```text
/project
  index.html
  style.css
  script.js
  README.md
```

## How To Run

1. Open `index.html` in any modern browser.
2. Start interacting with the dashboard.
3. Refresh the page to confirm data persistence through `localStorage`.

## Design and UX Notes

- Clean fintech-inspired UI
- Responsive grid and card layout
- Glassmorphism-inspired surfaces
- Smooth hover states and button feedback
- Light and dark theme compatibility
- Strong visual hierarchy for metrics, charts, and actions

## Known Limitations

- No backend or authentication layer
- Data is stored only in the browser
- Data does not sync across devices
- Currency selector changes symbol display only and does not perform real conversion

## Why This Project Stands Out

This project goes beyond a simple expense tracker by combining:

- Product-style UI polish
- Data visualization
- Role-based interaction
- Persistent client-side state
- Usability-focused details such as confirmations, empty states, and live feedback

It reflects both frontend implementation skill and attention to user experience, making it a strong portfolio project for showcasing practical dashboard development.
