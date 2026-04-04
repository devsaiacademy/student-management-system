# Student Management System - Feature Specification v1.0

## Overview

A web-based student management system enabling administrators to manage student records while parents can view information and make payments through the platform.

---

## User Roles

### 1. Admin
- Full access to manage student records
- Add payment 
- Mark as paid when paid via cash  
- Record and track payments
- View all payment history


### 2. Parent
- View payment history
- Make payments through the website

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

### Parent Portal
- View linked children profiles
- View payment history
- pay fees

### Payment System
- Online payment via Razorpay integration
- Payment Plan:
  - Single
  - Flexible (with Emi upto 12 months)
- Payment status tracking (pending, paid, failed)
- Payment history with receipts
- Admin can record manual payments

### Dashboard
- Admin: Overview of students, recent payments
- Parent: Children summary, pending payments

---

## Database Schema (Planned) better explanation in db-v1

### Tables
  - user_profiles (Stores app role mapping for authenticated users (admin or student).)
  - students (Main student profile data, including contact details, school info, and auth_user_id link.)
  - enrollments (Course enrollment records per student, including fee plan (single/flexible).)
  - student_progress (Tracks learning/progress status for each enrollment (start/end, tutor, kit, status).)
  - payments (Payment ledger entries per enrollment (amount, method, status, due/paid dates).)
  - razorpay_orders (Razorpay order metadata and gateway references linked to students/payments.)

---

## Future Considerations Admin(v1.1+)
  - Improve admin control
    - add course
    - add duraion
    - add levels
  - Get more Tutor details