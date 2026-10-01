# College Internal Marks Notification System

A full-stack, production-grade web application designed for engineering colleges and universities to automate sending students' internal examination marks to registered parents via **WhatsApp** and **SMS**.

---

## 🌟 Key Features

1. **Excel Upload & Flexible Column Mapping**
   - Upload existing marks sheets directly (`.xlsx`, `.xls`).
   - Intelligent header auto-detection (e.g., `Reg No`, `Register No`, `Student Name`, `Parent Mobile`, and dynamic subject headers).
   - Interactive column mapping interface when columns vary.
   - Built-in downloadable sample templates (`sample_marks_standard.xlsx`, `sample_marks_varied_columns.xlsx`, `sample_marks_with_errors.xlsx`).

2. **Rigorous Validation & Error Handling**
   - Validates marks range (0 to maximum subject marks).
   - Validates parent phone number format (10-digit Indian standard with country code support).
   - Detects duplicate register numbers in sheet.
   - Comprehensive error reports with row numbers, affected fields, and download options.

3. **Privacy & Data Protection**
   - **Parent phone numbers are masked in all frontend previews** (`******3210`).
   - Raw phone numbers and API provider keys are never exposed to the client browser.

4. **Multi-Channel Personalized Dispatch**
   - Personalizes messages per student with tokens: `{{student_name}}`, `{{register_number}}`, `{{parent_name}}`, `{{exam_name}}`, `{{marks}}`, `{{total}}`, `{{maximum_marks}}`, `{{percentage}}`, `{{college_name}}`.
   - Supports **WhatsApp Cloud API** and **SMS Gateway** (DLT compliant).
   - Configurable **Mock Mode** for risk-free local testing and demonstration.
   - Duplicate dispatch prevention to prevent double-charging or accidental re-sending.

5. **Live Tracking, Retry & Reports**
   - Real-time batch progress tracking.
   - Status tracking (`PENDING`, `SENT`, `DELIVERED`, `FAILED`, `RETRYING`).
   - Single-click and bulk retry for failed deliveries.
   - Analytical reports: Student Performance, Class Performance, and Notification Delivery analytics with CSV exports.

6. **Role-Based Access Control (RBAC)**
   - **ADMIN**: Full access to settings, API credentials, audit logs, academic master data, templates, and student directory.
   - **FACULTY**: Upload marks, map columns, preview and dispatch notifications for assigned departments.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)

### 2. Start Both Frontend & Backend
Run the following command in the project root:
```bash
npm run dev
```

This starts:
- **Frontend (Vite + React + TailwindCSS):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Express + SQLite/Postgres):** [http://localhost:5000](http://localhost:5000)

---

## 🔐 Default Login Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `Admin@123` | Full system access, API keys, settings, audit logs |
| **Faculty** | `faculty@college.edu` | `Faculty@123` | Marks upload, column mapping, notifications preview & dispatch |

---

## 📁 Sample Excel Files for Testing

Three test files are located in `backend/sample_files/`:
1. `sample_marks_standard.xlsx`: 10 students, 4 subjects, standard headers (ready for 1-click import).
2. `sample_marks_varied_columns.xlsx`: Uses alternate column headers to demonstrate intelligent auto-mapping.
3. `sample_marks_with_errors.xlsx`: Contains intentional errors (invalid phone, negative marks, duplicate roll number) to demonstrate validation and error reporting.

You can also download a sample template directly from the **Upload Marks** page in the application.

---

## 🧪 Integration Test Suite

A comprehensive 25-step integration test verifies:
- Database schema and automatic migration
- Excel parsing and intelligent header matching
- Negative marks, out-of-range marks, duplicate register number detection
- Phone number privacy masking
- Template variable interpolation
- WhatsApp and SMS mock providers
- Batch queuing and duplicate prevention
- Failure retry mechanism

To execute the test suite:
```bash
cd backend
npm test
```
*Current test status: 25/25 Passing.*

---

## ⚙️ Configuration (`backend/.env`)

```env
DATABASE_URL=sqlite:./data/college_sms.sqlite
PORT=5000
NODE_ENV=development
JWT_SECRET=college_secret_jwt_key_super_secure_2026_dev
COLLEGE_NAME=ABC College of Engineering & Technology
MOCK_NOTIFICATION_PROVIDER=true

# WhatsApp Cloud API (when production ready)
WHATSAPP_PHONE_NUMBER_ID=109876543210987
WHATSAPP_ACCESS_TOKEN=EAABwz...
WHATSAPP_TEMPLATE_NAME=internal_marks_notification

# SMS Gateway (when production ready)
SMS_API_KEY=mock_fast2sms_api_key_12345
SMS_SENDER_ID=ABCENG
```

