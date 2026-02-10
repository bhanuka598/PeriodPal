# 🌸 PeriodPal – Menstrual Health Manager (Backend API)

PeriodPal is a RESTful backend system designed to reduce period poverty by connecting marginalized women with free sanitary products, menstrual health tracking, and NGO support under the concept of Menstrual Equity.

This backend is developed using **Node.js, Express.js, and MongoDB** as part of the SE3040 – Application Frameworks assignment.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Role-Based Access Control (RBAC)
- Postman for API Documentation

---

## 📌 Core Components (CRUD Based)

1. User Management (Admin, Beneficiary, NGO, Donor)
2. Menstrual Records Management
3. Product Request & Approval System
4. Inventory Management
5. Donation Management (with third-party payment integration)

---

## 📂 Project Structure

src/
│
├── models/
├── routes/
├── controllers/
├── middleware/
├── config/
├── utils/
└── server.js

---

## ⚙️ Setup Instructions (Run Locally)

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/periodpal.git
cd periodpal
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Create .env file

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

### 4️⃣ Run the server

```
npm run dev
```

Server will run on:
http://localhost:5000
