# Chawnah Foods Inc. — Equipment Accountability & Asset Tracking System

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) web application built for **Chawnah Foods Inc.** to track company assets, custody chains, employee accountability records (both active and historical), and generate official printable **Employee Equipment Accountability Forms**.

---

## ✨ Key Features

### 1. 👥 Employee & Group Accountability Directory
- **Employee Directory (`/employees`)**: Search by Name, Employee ID, Job Title, or Department with instant department filtering pills.
- **Store & Branch Accountability Directory (`/stores`)**:
  - Full branch custody overview for all **44 official store branches** of Chawnah Foods Inc. (e.g. *Metro Gaisano*, *ROBINSON MARASBARAS*, *SM SAVEMORE*, *ORMOC MAIN*, *BAYBAY*, *CATBALOGAN*, etc.).
  - Shows active equipment deployed per branch, store supervisor in-charge, and historical returns.
  - Direct 1-click **"+ Issue to this Store"** action.
- **Accountability Scope Support**:
  - 🏪 **Store Equipment**: Group accountability for retail branches (with Combobox).
  - 🏢 **Department Equipment**: Group accountability for company departments (QA, Logistics, Operations).
  - 🏛️ **Office Equipment**: Group accountability for shared facilities (HQ Conference Room, Admin).
  - 👤 **Individual Employee Equipment**: Personal accountability for issued gear.

### 2. 📦 Equipment Catalog & Chain of Custody (`/items`)
- **Asset Catalog**: Search by Item Description, Brand/Model, Serial Number, Asset Tag, or Custodian. Filter by Category and Status (*Available*, *Assigned*, *Under Maintenance*).
- **Item History & Custody Profile (`/items/:id`)**:
  - **Current Custodian Banner**: Shows current custodian, issuance date, condition, and quick link to return or view form.
  - **Previous Owners Record**: Detailed record of every prior employee who held the item, dates, condition before & after, charges, and remarks.
  - **Chronological Audit Trail**: Log of all actions (`REGISTERED`, `ASSIGNED`, `RETURNED`, `NOTE_ADDED`, `CONDITION_UPDATE`).
  - **Audit Notes & Remarks**: Ability to add inspection notes, battery health, or maintenance remarks anytime.

### 3. 📄 Official Employee Equipment Accountability Form (`/forms/:id`)
- **Exact Match to Company Form Specification**:
  - Company Header: **Chawnah Foods Inc.** — Operations & Logistics Division.
  - Employee Information (Name, Employee ID, Job Title, Department).
  - Equipment Details Table with condition checkboxes (**New**, **Good**, **Fair**) and remarks.
  - Word-for-word **Employee Responsibilities** clauses acknowledging Chawnah Foods Inc. ownership and policies.
  - **Condition Acknowledgment & Signatures** (Received in good working condition, noted issues, Released by, Approved by, Employee signature, and Date).
  - **Return Information Section** (Return Date, Condition Upon Return checkboxes, Completeness, Charges Assessment in ₱, Inspection notes, Approved by, Inspected by, Employee signature).
- **Flawless Browser Print (`@media print`)**: Formatted specifically for US Letter print/PDF export, hiding all UI navigation and buttons.

### 4. 🚀 Quick Form Issuance Wizard (`/forms/new`)
- Step-by-step interactive workflow:
  1. Select Employee (or register new on the fly)
  2. Select Available Items from inventory (multi-select support)
  3. Specify Condition at Issuance (New / Good / Fair) and remarks per item
  4. Authorizations & Signatures (Released By, Approved By, Employee name)
  5. Instantly creates the form and redirects to the printable document.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router v6
- **Backend**: Node.js, Express.js, Mongoose, Morgan, CORS, Dotenv
- **Database**: MongoDB (Local `mongodb://127.0.0.1:27017/chawnah_accountability`)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 or MongoDB Atlas

### 1. Install Dependencies
```bash
# In the project root
npm run install:all
```

### 2. Seed Sample Company Data
Populates realistic test data for Chawnah Foods Inc. (employees, equipment, active and returned accountabilities):
```bash
npm run seed
```

### 3. Start Development Servers
In two separate terminals:

```bash
# Terminal 1 - Backend Server (Port 5000)
npm run server

# Terminal 2 - Frontend Client (Port 5173)
npm run client
```

Open your browser at: **[http://localhost:5173](http://localhost:5173)**

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Dashboard statistics & recent audit activity |
| `GET` | `/api/employees` | List employees with active & past item counts |
| `GET` | `/api/employees/:id` | Employee profile + active and non-active records |
| `POST` | `/api/employees` | Register a new employee |
| `GET` | `/api/items` | List equipment with category/status filters |
| `GET` | `/api/items/:id` | Item details + previous owners & full timeline |
| `POST` | `/api/items` | Register new equipment into inventory |
| `POST` | `/api/items/:id/remarks` | Add audit remark or inspection note to item |
| `GET` | `/api/accountabilities` | List all accountability forms |
| `GET` | `/api/accountabilities/:id` | Single accountability form details |
| `POST` | `/api/accountabilities` | Issue new form & assign items |
| `POST` | `/api/accountabilities/:id/return-item/:itemId` | Process return of individual item |
| `POST` | `/api/accountabilities/:id/return-all` | Process return of all items in form |
| `POST` | `/api/seed` | Reset & seed realistic sample data |

---

## ☁️ Deploying to Vercel

The application is pre-configured for single-click deployment to **Vercel** with a unified static frontend and serverless Express API:

### 1. Prerequisites
- A free **MongoDB Atlas** cluster (or any cloud MongoDB connection URI).
- A **GitHub**, **GitLab**, or **Bitbucket** repository with your code pushed.
- A **Vercel** account.

### 2. Environment Variables to Configure in Vercel
Under your Vercel Project Settings > **Environment Variables**, add:
- `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chawnah_accountability?retryWrites=true&w=majority`).
  > **Note**: In MongoDB Atlas, ensure **Network Access** allows `0.0.0.0/0` (anywhere) so Vercel serverless functions can connect.
- `JWT_SECRET`: A secure random string for JWT token generation.
- `NODE_ENV`: `production`

### 3. Deploy via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new) and import your Git repository.
2. Keep the **Root Directory** as `./` (default).
3. Vercel automatically detects `vercel.json` (build command `cd client && npm install && npm run build` and output directory `client/dist`).
4. Click **Deploy**.

Once deployed, your full-stack application will run with seamless SPA routing and serverless backend API at `https://your-project.vercel.app`!

