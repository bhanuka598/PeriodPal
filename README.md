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

| Method | Endpoint                | Description         | Auth                                          |
| ------ | ----------------------- | ------------------- | --------------------------------------------- |
| POST   | /api/users/register     | Register user       | ✅ Admin/NGO/Beneficiary/Health Officer/Donor |
| POST   | /api/users/login        | Login               | ✅ Admin/NGO/Beneficiary/Health Officer/Donor |
| GET    | /api/users/profile      | Get user profile    | ✅ NGO/Beneficiary/Health Officer/Donor       |
| PUT    | /api/users/profile/:id  | Update user profile | ✅ NGO/Beneficiary/Health Officer/Donor       |
| GET    | /api/users              | Get all users       | ✅ Admin                                      |
| GET    | /api/users/:id          | Get user profile    | ✅ Admin                                      |
| PUT    | /api/users/:id          | Update user         | ✅ Admin                                      |
| DELETE | /api/users/:id          | Delete user         | ✅ Admin                                      |

### 🌼 Menstrual Records

| Method | Endpoint         | Description    | Auth           |
| ------ | ---------------- | -------------- | -------------- |
| POST   | /api/records     | Add record     | ✅ Beneficiary |
| GET    | /api/records/my  | Get my records | ✅ Beneficiary |
| PUT    | /api/records/:id | Update record  | ✅ Beneficiary |
| DELETE | /api/records/:id | Delete record  | ✅ Beneficiary |

### 🏪 Inventory

| Method | Endpoint                  | Description                                | Auth         |
| ------ | ------------------------- | ------------------------------------------ | ------------ |
| POST   | /api/inventory            | Create new inventory record                | ✅ Admin/NGO |
| GET    | /api/inventory            | Get all inventory records                  | ✅ Admin/NGO |
| GET    | /api/inventory/:id        | Get single inventory by ID                 | ✅ Admin/NGO |
| PUT    | /api/inventory/:id        | Update full inventory record               | ✅ Admin/NGO |
| PATCH  | /api/inventory/:id/adjust | Increase or decrease stock quantity        | ✅ Admin/NGO |
| DELETE | /api/inventory/:id        | Delete inventory record                    | ✅ Admin     |
| GET    | /api/inventory/nearby     | Convert GPS to address (OpenStreetMap API) | ✅ Admin/NGO |

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

### Backend Deployment

#### Deployment Platform: Render

The backend RESTful API (Express.js/Node.js) is deployed on Render.

#### Setup Steps

1. **Prepare the Backend**
   ```bash
   cd backend
   npm install
   ```

2. **Create a Render Account**
   - Sign up at [render.com](https://render.com)
   - Create a new Web Service

3. **Connect Repository**
   - Connect your GitHub repository to Render
   - Select the `backend` folder as the root directory

4. **Configure Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: 18.x or higher

5. **Set Environment Variables**
   - Add the following environment variables in Render dashboard:
     - `MONGO_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `PORT`: 5000 (or your preferred port)
     - `SESSION_SECRET`: Your session secret key
     - `NODE_ENV`: production
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
     - `GOOGLE_CALLBACK_URL`: Your deployed API URL + `/api/auth/google/callback`

6. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy on every push to the connected branch

#### Alternative Backend Deployment Platforms

**Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add MongoDB
railway add mongodb

# Set environment variables
railway variables set MONGO_URI=$MONGO_URI
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set SESSION_SECRET=$SESSION_SECRET
railway variables set GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
railway variables set GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
railway variables set NODE_ENV=production

# Deploy
railway up
```

**Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create periodpal-backend

# Set environment variables
heroku config:set MONGO_URI=$MONGO_URI
heroku config:set JWT_SECRET=$JWT_SECRET
heroku config:set SESSION_SECRET=$SESSION_SECRET
heroku config:set GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
heroku config:set GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Frontend Deployment

#### Deployment Platform: Vercel

The React frontend application is deployed on Vercel.

#### Setup Steps

1. **Prepare the Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Install Vercel CLI: `npm install -g vercel`

3. **Deploy**
   ```bash
   cd frontend
   vercel
   ```
   - Follow the prompts to deploy
   - Set the project name and confirm settings

4. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add `VITE_API_URL`: Your deployed backend API URL

5. **Production Deploy**
   ```bash
   vercel --prod
   ```

#### Alternative Frontend Deployment Platforms

**Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the frontend
cd frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**Firebase Hosting**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Select frontend/dist as public directory
# Configure as single-page app

# Deploy
firebase deploy
```

### Environment Variables

#### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/periodpal` |
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-jwt-key` |
| `PORT` | Server port | `5000` |
| `SESSION_SECRET` | Secret key for session management | `your-session-secret-key` |
| `NODE_ENV` | Environment mode | `production` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | `https://your-api.com/api/auth/google/callback` |

#### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-api.onrender.com` |

**Note**: Never commit actual secrets to version control. Use `.env` files locally and add them to `.gitignore`.

### Live URLs

#### Deployed Backend API
```
https://periodpal-backend.onrender.com
```

#### Deployed Frontend Application
```
https://periodpal-frontend.vercel.app
```

### Deployment Evidence

#### Backend Deployment Verification

![Backend Deployment Screenshot](./screenshots/backend-deployment.png)

**Verification Steps:**
1. Visit the backend health endpoint: `https://periodpal-backend.onrender.com/`
2. Expected response: `"PeriodPal API is running..."`
3. Test API endpoints using Postman or curl:
   ```bash
   curl https://periodpal-backend.onrender.com/api/products
   ```

#### Frontend Deployment Verification

![Frontend Deployment Screenshot](./screenshots/frontend-deployment.png)

**Verification Steps:**
1. Visit the frontend URL: `https://periodpal-frontend.vercel.app`
2. Verify the application loads correctly
3. Test user authentication flow
4. Verify API calls are successful (check browser console for errors)

#### CI/CD Pipeline

**Backend (Render)**
- Automatic deployment on push to `main` branch
- Build logs available in Render dashboard
- Health checks configured for API monitoring

**Frontend (Vercel)**
- Automatic deployment on push to `main` branch
- Preview deployments for pull requests
- Build logs and deployment status in Vercel dashboard

### Post-Deployment Checklist

- [ ] Backend API is accessible and responding
- [ ] Frontend application loads without errors
- [ ] Database connection is established
- [ ] Authentication flow works (register, login, Google OAuth)
- [ ] All API endpoints are functional
- [ ] CORS configuration is correct
- [ ] Environment variables are properly set
- [ ] File uploads (product images) work correctly
- [ ] Email notifications are configured (if applicable)
- [ ] SSL/HTTPS is enabled
- [ ] Error monitoring is set up (optional)
- [ ] Performance monitoring is configured (optional)

---

## 👥 Team Members & Contributions

| Name                    | Component               |
| ----------------------- | ----------------------- |
| Bhanuka Athukoarala     | User Management         |
| Sayani Kathrikamanathan | Menstrual Records       |
| Nethmi Hewasinghe       | Inventory Management    |
| Tharusha Maheepala      | Donations Management    |
