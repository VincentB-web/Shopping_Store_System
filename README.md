# Sidewalk Stall POS

A lightweight point of sale and inventory manager for a small food stall. The menu starts with sample burgers, milk teas, drinks, and street food that you can edit in the app.

## Run locally

Install PHP with PDO SQLite enabled, then open a terminal in this folder and run:

```sh
php -S localhost:8000
```

Visit [http://localhost:8000](http://localhost:8000). The app creates `stall-pos.sqlite` in this folder on its first run. Keep this file to retain products, stock, and sales. Back it up regularly.

## What it can do

- Take orders, change quantities, choose cash or GCash, and save completed sales.
- Track product stock and automatically deduct sold quantities.
- Add, display, edit, and delete menu products; adjust stock from the inventory page.
- Review today’s sales, order count, low stock, and recent transactions.
- Use the responsive layout on a desktop, tablet, or phone.

This starter app does not include user accounts or online payment processing. GCash is recorded as the payment method; collect the payment separately at the stall.

