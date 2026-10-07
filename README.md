# Home Physio Management

A mobile-friendly PWA for home-visit physiotherapy management.

## Features
- Patient add/edit
- Therapist add/edit
- Visit scheduling and editing
- Payment collection
- Due calculation
- Due -> Paid workflow
- Patient history
- Income/due reports
- Login with Supabase Auth
- Cloud database + multi-device sync
- PWA install on mobile

## 1. Create Supabase project
Create a Supabase project and enable Email/Password authentication.

## 2. Create database
Open Supabase SQL Editor and run `schema.sql`.

## 3. Add therapist accounts/data
After the database is ready, insert:
- Md Ariful Islam PT
- Most. Sargina Akter PT

## 4. Configure app
Open `app.js` and replace:
SUPABASE_URL = "YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"

Use the project's public anon/publishable key only. Never put the service_role key in this app.

## 5. GitHub
Create a repository, upload all files, then enable GitHub Pages from Settings -> Pages -> Deploy from branch -> main -> /(root).

GitHub Pages serves static files. Database/auth are provided by Supabase.

## Important
Do not put patient data directly into the GitHub repository. The app stores patient data in Supabase.

## Future upgrades
- Therapist-specific permissions
- Recurring visits
- WhatsApp/SMS reminders
- Printable receipts
- PDF patient reports
- Expense management
- Backup/export
- Better calendar
- Treatment-note templates
