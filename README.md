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

The local PHP version does not include user accounts or online payment processing. The Netlify deployment has an admin password gate. GCash is recorded as the payment method; collect the payment separately at the stall.

## Deploy to Netlify

The Netlify build uses the static app in `netlify-site/`, Netlify Functions for the API, and Netlify Database (Postgres) for persistent sales and inventory. The PHP app at the repository root remains for local PHP development.

1. Import this GitHub repository into Netlify and create a Netlify Database for the site. Database availability and function usage depend on your Netlify plan.
2. In the Netlify site settings, add `POS_ADMIN_PASSWORD` with a strong admin password and `POS_SESSION_SECRET` with a long random secret (at least 32 characters). These values must be set as runtime environment variables for Functions.
3. Deploy the site. Netlify publishes `netlify-site/`, applies the database migration, and deploys the API function.

The live Netlify app starts with a fresh menu and sales database. The local SQLite file is not included in the Netlify publish directory or Git. Do not add credentials or the local database to the repository.

