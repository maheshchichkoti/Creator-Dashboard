# ✨ Creator Dashboard - VertxAI Assignment ✨

A full-stack MERN application enabling creators to manage their profile, earn credits, and engage with an aggregated content feed. Admins have oversight capabilities for user management and analytics.

---

## Live Demo Links

- **Frontend (Render):** [https://creator-dashboard-test.onrender.com](https://creator-dashboard-test.onrender.com)
- **Backend Health Check (Render):** https://creator-dashboard-i8uo.onrender.com/api/health

---creator-dashboard

## 📋 Table of Contents

- [Project Description](#project-description)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Screenshots (Optional)](#screenshots-optional)

---

## 📖 Project Description

This application serves as a central hub for content creators.  
Users can register, log in securely using JWT, interact with content fetched from external APIs (Reddit, simulated Twitter/LinkedIn), save/share/report posts, and track their engagement through a credit system.  
The application features distinct roles for regular users and administrators, providing tailored dashboards and functionalities.

---

## ✨ Key Features

### User Features:

- Secure User Registration & Login (JWT Authentication with Access/Refresh Tokens)
- Personalized Dashboard displaying:
  - Credit balance
  - Saved posts
  - Recent activity
  - Notifications
- Aggregated Content Feed (fetching from Reddit, simulated Twitter)
- Interact with Feed Posts:
  - Save posts
  - Share posts (copy link)
  - Report inappropriate posts
- Credit System:
  - Earn points for daily logins, saving posts, etc.
  - Spend credits
- View Notifications for activities like saving or reporting posts

### Admin Features:

- Admin-only access to specific routes/dashboards
- User Management:
  - View all registered users (with pagination)
  - Update user credits directly
- View Analytics:
  - Top users by credits
  - Top saved feed posts
- Review Reported Posts submitted by users

---

## 🛠 Tech Stack

### Frontend:

- React.js (Vite)
- Tailwind CSS
- React Router v6
- Axios
- React Toastify
- React Context API

### Backend:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- express-validator
- cors
- helmet
- express-mongo-sanitize
- cookie-parser

### Deployment:

- Backend: Render (Web Service)
- Frontend: Render (Static Site)
- Database: MongoDB Atlas

---

## 🗂 Project Structure

```
.
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── .env
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Prerequisites

- Node.js (v18.x or later)
- npm or yarn
- Git
- MongoDB Atlas Account

---

## ⚙️ Installation & Setup

### Clone the repository:

```bash
git clone [YOUR_REPOSITORY_URL]
cd Creator-Dashboard
```

### Setup Backend:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=8000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Setup Frontend:

```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🏃 Running Locally

### Run Backend Server:

```bash
cd backend
npm run dev
```

Backend will run at: `http://localhost:8000`

### Run Frontend Dev Server:

```bash
cd frontend
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## Deployment

This application is deployed on Render:

- **Backend:** Deployed as a "Web Service"

  - Build Command: `npm install`
  - Start Command: `node server.js`
  - Environment Variables: MONGO_URI, JWT_SECRET, CLIENT_URL, NODE_ENV=production

- **Frontend:** Deployed as a "Static Site"
  - Build Command: `npm run build`
  - Publish Directory: `dist`
  - Environment Variable: VITE_API_URL pointing to deployed backend URL

---

## 📚 API Documentation

| Method | Endpoint                    | Description                        | Access |
| :----: | :-------------------------- | :--------------------------------- | :----: |
|  POST  | /api/auth/register          | Register a new user                | Public |
|  POST  | /api/auth/login             | Login user and get tokens          | Public |
|  GET   | /api/auth/refresh-token     | Get new access token               | Public |
|  GET   | /api/feed                   | Get aggregated feed posts          |  User  |
|  GET   | /api/user/dashboard         | Get user dashboard data            |  User  |
|  POST  | /api/user/save-feed         | Save a feed post                   |  User  |
|  POST  | /api/user/share-feed        | Record sharing a feed post         |  User  |
|  POST  | /api/user/spend-credits     | Spend credits                      |  User  |
|  GET   | /api/user/notifications     | Get user notifications             |  User  |
|  POST  | /api/report/report          | Report a feed post                 |  User  |
|  GET   | /api/admin/users            | Get all users (paginated)          | Admin  |
|  PUT   | /api/admin/user/:id/credits | Update user credits                | Admin  |
|  GET   | /api/admin/top-users        | Get top 5 users by credits         | Admin  |
|  GET   | /api/admin/top-saved-feeds  | Get top 5 saved posts              | Admin  |
|  GET   | /api/report/reports         | Get all reported posts (paginated) | Admin  |
|  GET   | /api/health                 | Backend health check               | Public |

---

## 📸 Screenshots (Optional)

(You can add screenshots here later)

- Login Page
- User Dashboard
- Feed Page
- Admin Dashboard

---

# 🎯 Final Notes

- This project demonstrates full-stack MERN development with authentication, role-based access, and real-world features.
- Built with ❤️ by Mahesh Chitakoti for VertxAI Assignment.

---
