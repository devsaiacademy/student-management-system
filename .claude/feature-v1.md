# Student Management System - Feature Specification v1.0

## Overview

A web-based student management system enabling administrators to manage student records while parents can view information and make payments through the platform.

---

## User Roles

### 1. Admin
- Full access to manage student records
- Record and track payments
- View all payment history

### 2. Parent
- View own children's information
- Make payments through the website
- View payment history

---

## Core Features

### Authentication
- Supabase Auth for user management
- Role-based access control (admin, parent)
- Secure login with email/otp or google oauth

### Student Management (Admin)
- Add new student records
- Edit existing student information
- Delete students
- View student list with search/filter
- Student fields:
  - Full name
  - Email address
  - Phone number
  - Grade/Class
  - Enrollment date
  - Status (active/inactive)

### Parent Portal
- View linked children profiles
- Access student details
- View payment history

### Payment System
- Online payment via Razorpay integration
- Payment categories:
  - Tuition fees
  - School fees
  - Events
- Payment status tracking (pending, paid, failed)
- Payment history with receipts
- Admin can record manual payments

### Dashboard
- Admin: Overview of students, recent payments
- Parent: Children summary, pending payments

---

## Database Schema (Planned)

### Tables
- `users` - Extended auth.users with role
- `students` - Student records
- `parents` - Parent records linked to students
- `payments` - Payment transactions
- `payment_items` - Individual payment line items

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: tRPC API routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Auth**: Supabase Auth
- **Payments**: Razorpay
- **UI**: shadcn/ui components

---

## Out of Scope v1.0

- Multi-school/tenant support
- Student attendance tracking
- Grade management
- Teacher management
- Email notifications
- SMS notifications

---

## Future Considerations (v1.1+)

- Attendance tracking
- Gradebook integration
- Parent-teacher messaging
- Document upload (assignments, results)
- Mobile app
- Fee structure management