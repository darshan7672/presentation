# 🧪 CarbonX Comprehensive QA & Bug Test Plan

This document outlines the end-to-end Bug Testing & Quality Assurance (QA) test plan for the **CarbonX** carbon credit marketplace platform (`hackathon-carbox`).

---

## 📋 Table of Contents
1. [Module 1: Authentication & Role-Based Access Control (RBAC)](#module-1-authentication--role-based-access-control-rbac)
2. [Module 2: Farmer Portal & Data Entry](#module-2-farmer-portal--data-entry)
3. [Module 3: Industry Dashboard & ESG Footprint Tracker](#module-3-industry-dashboard--esg-footprint-tracker)
4. [Module 4: Carbon Credit Marketplace](#module-4-carbon-credit-marketplace)
5. [Module 5: Checkout & Razorpay Payment Gateway Integration](#module-5-checkout--razorpay-payment-gateway-integration)
6. [Module 6: Admin Panel & Satellite Farm Monitor](#module-6-admin-panel--satellite-farm-monitor)
7. [Module 7: Supabase Database Integrity & RLS Security](#module-7-supabase-database-integrity--rls-security)
8. [Module 8: Cross-Browser, Responsive & UI/UX Testing](#module-8-cross-browser-responsive--uiux-testing)
9. [Module 9: Edge Cases, Security & Error Handling](#module-9-edge-cases-security--error-handling)

---

## 🔑 Module 1: Authentication & Role-Based Access Control (RBAC)

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Farmer Login Success | Log in with valid farmer credentials (`farmer@carbonx.com`). | Redirects to `/farmer` dashboard. Navbar displays Farmer links (`Training`, `Funding`). | `[ ]` |
| **AUTH-02** | Industry Login Success | Log in with valid industry credentials (`industry@carbonx.com`). | Redirects to `/industry` dashboard. Navbar displays Industry links (`Marketplace`, `Profile`). | `[ ]` |
| **AUTH-03** | Admin Login Success | Log in with superuser/admin credentials (`admin@carbonx.com`). | Redirects to `/admin` panel. Navigation options for `/admin` and `/monitor` available. | `[ ]` |
| **AUTH-04** | Invalid Credentials | Attempt login with invalid email or password. | Displays error toast/alert: "Invalid login credentials". User remains on `/login`. | `[ ]` |
| **AUTH-05** | Unauthenticated Route Guard | Attempt direct access to protected routes (`/farmer`, `/industry`, `/checkout`, `/admin`) while logged out. | Automatically redirects user to `/login`. | `[ ]` |
| **AUTH-06** | Unauthorized Role Access | Logged in as `farmer`, manually navigate to `/industry` or `/admin`. | Role guard redirects farmer back to `/farmer`. | `[ ]` |
| **AUTH-07** | Superuser Admin Role Bypass | Logged in as `admin`, navigate to `/farmer`, `/industry`, or `/checkout`. | Admin role bypasses restriction and views page successfully. | `[ ]` |
| **AUTH-08** | User Logout Flow | Click "Logout" in Navbar. | Supabase session cleared, state reset, redirected to `/login`. Back button cannot access protected routes. | `[ ]` |

---

## 🌾 Module 2: Farmer Portal & Data Entry

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **FARM-01** | Farm Land Data Entry | Submit farm details (Acres, Crop Type, Location, Practice Type). | Farm record saved to database. Estimated carbon credits generated and shown in pending queue. | `[ ]` |
| **FARM-02** | Land Verification Document Upload | Upload PDF/PNG land ownership certificate via `FileUpload.jsx`. | File stored in Supabase storage bucket. URL linked to farm entry. | `[ ]` |
| **FARM-03** | File Upload Constraints | Upload non-supported file (e.g. `.exe`, `.zip`) or file > 10MB. | Displays error message: "Invalid file type/size limit exceeded". Upload rejected. | `[ ]` |
| **FARM-04** | Training Module Progress | Access `/training`, complete a sustainability module quiz. | Quiz score recorded, training completion badge updated in farmer profile. | `[ ]` |
| **FARM-05** | Micro-Funding Application | Apply for seed funding on `/funding` page with requested amount. | Application status updated to "Under Review". Displayed in farmer dashboard & admin panel. | `[ ]` |
| **FARM-06** | Negative/Invalid Farm Inputs | Enter negative acreage (-50 acres) or zero values. | Form validation prevents submission with message "Value must be greater than 0". | `[ ]` |

---

## 🏭 Module 3: Industry Dashboard & ESG Footprint Tracker

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **IND-01** | Carbon Footprint Calculator | Enter Scope 1, Scope 2, Scope 3 fuel and energy usage metrics. | Total CO₂ metric tons dynamically updated. Net credit deficit calculated. | `[ ]` |
| **IND-02** | Net-Zero Progress Gauge | Update purchased carbon credits total. | Visual progress bar updates % towards Net-Zero goal accurately. | `[ ]` |
| **IND-03** | Profile Update & GSTIN/PAN Validation | Navigate to `/industry/profile`, edit company details & tax ID. | Profile saved in Supabase `profiles` table. Success message notification shown. | `[ ]` |
| **IND-04** | Industry Emissions Table | View historical emissions log on Industry Dashboard. | Data populated from `industry_emissions` table matching current user's ID. | `[ ]` |
| **IND-05** | Offset Certificate Download | Click "Download Certificate" for completed offsets. | Generates/downloads official PDF certificate containing transaction hash and tons offset. | `[ ]` |

---

## 🛒 Module 4: Carbon Credit Marketplace

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **MKT-01** | Listing Display & Filter | View available project listings on `/marketplace`. Filter by Location/Type. | Cards filter correctly by selected category (e.g. Agroforestry, Biochar). | `[ ]` |
| **MKT-02** | Real-Time Credit Inventory | Check inventory count for listed project. | Available ton credits match database inventory. Sold out listings marked disabled. | `[ ]` |
| **MKT-03** | Project Detail Navigation | Click "Buy Credits" on project card. | Navigates to `/checkout?projectId={id}` with selected project preloaded. | `[ ]` |
| **MKT-04** | Out-of-Stock Handling | Attempt to purchase credits for a project with 0 available credits. | "Buy Credits" button disabled with status badge "Sold Out". | `[ ]` |

---

## 💳 Module 5: Checkout & Razorpay Payment Gateway Integration

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **PAY-01** | Dynamic Quantity Calculation | Increase/decrease credit count on `/checkout`. | Subtotal, Platform Fee (5%), Total USD/INR cost, and Impact Metrics update instantly. | `[ ]` |
| **PAY-02** | Razorpay Modal Trigger | Click "Confirm and Offset". | `loadRazorpay` SDK initializes, Razorpay test payment modal opens overlay. | `[ ]` |
| **PAY-03** | Payment Success Flow | Use Razorpay Test Card/UPI and complete test payment. | Payment success handler fires: record inserted to Supabase `purchases`, redirects to `/confirmation`. | `[ ]` |
| **PAY-04** | Payment Dismiss/Cancel | Close Razorpay modal without paying. | Modal closes, loading state resets (`paying = false`), user stays on `/checkout` with intact state. | `[ ]` |
| **PAY-05** | Payment Failure Handling | Simulate declined payment card in Razorpay test mode. | Error alert displayed: "Payment failed: [Reason]". Transaction not saved in DB. | `[ ]` |
| **PAY-06** | Confirmation Page State | Verify parameters on `/confirmation` after payment. | Displays exact quantity, Razorpay Payment ID, Project Name, and Trees/Cars impact calculation. | `[ ]` |
| **PAY-07** | SDK Load Failure | Simulate slow/failed internet connection blocking Razorpay script load. | Error displayed: "Could not load payment gateway. Check your internet connection." | `[ ]` |

---

## 📡 Module 6: Admin Panel & Satellite Farm Monitor

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ADM-01** | Pending Verification Queue | Navigate to `/admin`, view submitted farmer verification requests. | Displays pending listings with land document attachments. | `[ ]` |
| **ADM-02** | Approve Credit Listing | Click "Approve" on pending listing. | Listing status changes to "Verified". Credits minted and listed on Marketplace. | `[ ]` |
| **ADM-03** | Reject Listing with Reason | Click "Reject" and provide rejection note. | Status set to "Rejected". Notification sent to farmer dashboard. | `[ ]` |
| **ADM-04** | Farm Satellite Monitor (`/monitor`) | Open satellite NDVI vegetation monitor for registered plot coordinates. | Interactive map/satellite imagery loads with health indices and canopy metrics. | `[ ]` |
| **ADM-05** | System Analytics Summary | Verify platform aggregate statistics on `/admin`. | Total offset tons, active farmers, total payout amounts calculate accurately. | `[ ]` |

---

## 🗄️ Module 7: Supabase Database Integrity & RLS Security

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **DB-01** | Profile Row Creation | Sign up a new user via `/login`. | Trigger automatically inserts profile row in `profiles` table with selected role. | `[ ]` |
| **DB-02** | Row Level Security (RLS) - Purchases | Attempt querying another user's purchases directly via REST API. | Supabase RLS restricts query results strictly to `auth.uid() = user_id`. | `[ ]` |
| **DB-03** | Listing Table Mutation Guard | Attempt mutating credit listings as non-admin user. | Permission denied error returned by Supabase API. | `[ ]` |
| **DB-04** | Env Var Security | Inspect client bundle for leaked secret keys (`SUPABASE_SERVICE_ROLE_KEY`). | Only public `VITE_SUPABASE_ANON_KEY` and `VITE_RAZORPAY_KEY_ID` are exposed. | `[ ]` |

---

## 🎨 Module 8: Cross-Browser, Responsive & UI/UX Testing

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **UI-01** | Mobile Viewport (375px - 430px) | View all screens on iOS/Android mobile resolution. | Responsive layout, hamburger menu working, no horizontal overflow. | `[ ]` |
| **UI-02** | Desktop Viewport (1440px+) | View screens on widescreen monitors. | Centered containers (`max-w-7xl`), backdrop glassmorphism & cards aligned. | `[ ]` |
| **UI-03** | Navbar Visibility | Navigate to `/login` and `/logout`. | Navbar is hidden cleanly on login/logout pages, visible on all core dashboard pages. | `[ ]` |
| **UI-04** | Micro-Animations & Framer Motion | Interact with hover cards, modal transitions, quantity toggles. | Smooth transitions without layout shifts or jank (60fps). | `[ ]` |
| **UI-05** | Cross-Browser Compatibility | Test core flows in Chrome, Firefox, Safari, and Edge. | Identical styling, payment popup support, SVG icons rendered properly. | `[ ]` |

---

## ⚡ Module 9: Edge Cases, Security & Error Handling

| Test ID | Scenario Description | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **EDGE-01** | Double Payment Click | Rapidly click "Confirm and Offset" button multiple times. | Button disables immediately during processing; prevents duplicate Razorpay popups. | `[ ]` |
| **EDGE-02** | Direct URL Access to `/confirmation` | Navigate directly to `/confirmation` without transaction state in history. | Page gracefully handles missing state, shows fallback message or redirects to `/marketplace`. | `[ ]` |
| **EDGE-03** | Rapid Quantity Spinner Toggling | Click quantity increase/decrease buttons rapidly on Checkout. | State stays consistent, prevents quantity from dropping below 1. | `[ ]` |
| **EDGE-04** | Session Expiration Mid-Flow | Invalidate Supabase token while user is on `/checkout`, then submit payment. | Session re-check fails, prompts re-login without losing cart state if possible. | `[ ]` |
| **EDGE-05** | XSS / Injection in Forms | Submit script tags (`<script>alert(1)</script>`) in input fields. | Inputs sanitized, text rendered safely without script execution. | `[ ]` |

---

## 📊 Test Execution Summary Matrix

- **Total Test Cases**: 45
- **Critical Path Tests**: 16 (Auth, Checkout, Razorpay, Admin Approval)
- **High Priority Tests**: 18 (Calculators, RLS, File Uploads, Role Guards)
- **Medium Priority Tests**: 11 (UI Animations, Responsiveness, Training)

---
*Plan created for CarbonX Platform (`hackathon-carbox`).*
