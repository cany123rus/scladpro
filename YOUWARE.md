# Warehouse Management System

A modern web application for warehouse management with Supabase backend.

## Features

- **Authentication**:
  - Email/Password Login
  - QR Code Login (Admin only)
  - Admin Initialization (Auto-create admin user)
- **Suppliers Management**:
  - Real-time list of suppliers
  - Add new suppliers
  - Telegram Chat ID integration
- **Real-time Sync**: Updates across all devices instantly using Supabase Realtime.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **Icons**: Lucide React
- **QR Code**: qrcode.react

## Setup

1. **Supabase**: The project is connected to Supabase project `warehouse-db`.
2. **Admin Setup**:
   - On the Login page, click "Initialize Admin (First Run)".
   - This creates the user `admin@warehouse.local` with password `123456`.
   - A random QR code is generated for the admin.
3. **QR Login**:
   - Use the generated QR code string to log in via the "QR Code" tab.

## Database Schema

- `suppliers`: Stores supplier info (`name`, `telegram_chat_id`).
- `profiles`: Stores user profiles and QR codes.
- `supplies`: Stores supply info (`name`, `supplier_id`, `status`).
- `boxes`: Stores boxes in a supply.
- `supply_items`: Stores items in a box.
- `app_settings`: Stores application settings and logs (e.g., database backup logs).

## Features Update (Jan 2026)
- **Mobile Adaptation**: Fully responsive design with mobile sidebar and header.
- **Telegram Integration**:
  - Secure Bot Token storage (localStorage + UI Lock).
  - Support for multiple bots (Main, Reception, File).
  - Send messages and files to suppliers manually or automatically.
- **Supply Workflow**:
  - "Close Supply" action generates Excel report and sends to Supplier via Telegram.
  - Excel format: Barcode, Quantity, Box Barcode.
  - Closed supplies are locked for editing (can be unlocked by admin).
- **Reception Workflow**:
  - Create/Edit receptions with photo evidence.
  - Save progress to database.
  - Send reception report (photos + summary) to Supplier via Telegram.
  - History of receptions with status tracking.
- **Employee Management**:
  - Generate and Print QR codes for employees (optimized for 58x40mm stickers).
- **Database Management**:
  - Version logs, upload backup, and view history.
- **Reporting**:
  - Enhanced Supplier Report with "Average cost per unit" metric.
  - Added "Average cost per unit for all time" infographic using all-time stats.
  - Added "Average cost per unit by supplier" summary section in Reports tab.
  - Display monetary value of boxes (quantity × average price).
  - **Employee Report**: Added date range selection for Telegram reports.
  - **UI Improvements**: Separated Supplier Report and Warehouse History sections for better usability.
  - **Telegram Bot (File Upload)**:
    - Implemented Supabase Edge Function `telegram-bot` to handle file uploads from suppliers.
    - Bot (`@scladprofilebot`) shows "Отправить файл" button.
    - Files are saved to `print_files` bucket and table, linked to the supplier by Chat ID.
- **Design Update (Jan 2026)**:
  - **Color Palette**: Migrated to a premium "Slate" neutral palette and a custom "Corporate Blue" brand color (replacing Indigo).
  - **Typography**: Standardized on `Inter` font for better readability and modern aesthetic.
  - **Visual Harmony**: Enhanced contrast and reduced visual fatigue by avoiding high-saturation purples.

- `npm install`: Install dependencies
- `npm run dev`: Start development server
- `npm run build`: Build for production
