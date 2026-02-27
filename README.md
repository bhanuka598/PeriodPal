# 🌸 PeriodPal – Menstrual Health Manager

PeriodPal is a RESTful backend system designed to reduce period poverty by connecting marginalised women with free sanitary products, menstrual health tracking, and NGO support under the concept of Menstrual Equity.

This backend is developed using **Node.js, Express.js, and MongoDB** as part of the Application Frameworks assignment.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Role-Based Access Control (RBAC)
- Postman for API Documentation

---

## 📌 Core Components

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

---

## 🔐 Authentication & Roles

The system uses JWT authentication and Role-Based Access.

| Role           | Access                           |
| -------------- | -------------------------------- |
| Admin          | Full system access               |
| Beneficiary    | Records, Product Requests        |
| NGO            | Inventory, Approve Requests      |
| Donor          | Donations                        |
| Health Officer | View records & health monitoring |

---

## 📘 API Endpoint Documentation

### 👤 Users

| Method | Endpoint            | Description      | Auth    |
| ------ | ------------------- | ---------------- | ------- |
| POST   | /api/users/register | Register user    | ❌       |
| POST   | /api/users/login    | Login            | ❌       |
| GET    | /api/users          | Get all users    | ✅ Admin |
| GET    | /api/users/:id      | Get user profile | ✅       |
| PUT    | /api/users/:id      | Update user      | ✅       |
| DELETE | /api/users/:id      | Delete user      | ✅ Admin |

### 🌼 Menstrual Records

| Method | Endpoint         | Description    | Auth          |
| ------ | ---------------- | -------------- | ------------- |
| POST   | /api/records     | Add record     | ✅ Beneficiary |
| GET    | /api/records/my  | Get my records | ✅ Beneficiary |
| PUT    | /api/records/:id | Update record  | ✅ Beneficiary |
| DELETE | /api/records/:id | Delete record  | ✅ Beneficiary |

### 🏪 Inventory



### 💖 Donations



---

## 🧪 Testing Instructions

### Unit Testing

```
npm test
```

### Integration Testing

Test API endpoints using Postman Client.

### Performance Testing

Using Artillery:

```
artillery run performance-test.yml
```

---

## 🌍 Deployment

### Backend Deployment Platform

Vercel

### Environment Variables Used

- MONGO_URI
- JWT_SECRET
- PORT
- SESSION_SECRET
- NODE_ENV
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL

### Live API URL

https://your-deployed-api-url.com

---

## 👥 Team Members & Contributions

| Name                    | Component               |
| ----------------------- | ----------------------- |
| Bhanuka Athukoarala     | User Management         |
| Sayani Kathrikamanathan | Menstrual Records       |
| Nethmi Hewasinghe       | Inventory Management    |
| Tharusha Maheepala      | Donations Management    |
