Creator Dashboard - VertxAI Assignment
📋 Project Description
A full-stack web application where users (creators) can:

Manage their profile
Earn and spend credits
Interact with a personalized feed (Reddit, Twitter, LinkedIn)
Save, share, and report posts
Admins can manage users, view analytics, and review reports
🛠 Tech Stack
Frontend: React.js, Tailwind CSS
Backend: Node.js, Express.js
Database: MongoDB Atlas
Authentication: JWT (Access + Refresh Tokens)
Deployment: (You will mention GCP / Firebase Hosting)
🚀 Features
User Registration and Login (JWT Authentication)
Role-based Access (User / Admin)
Credit Points System (Earn + Spend)
Feed Aggregator (Reddit, Twitter, LinkedIn)
Save, Share, Report Posts
User Dashboard (Credits, Saved Feeds, Activity)
Admin Dashboard (Manage Users, View Reports, Analytics)
Pagination in Feed
Refresh Tokens for secure authentication
📂 Project Structure
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── config/
├── server.js
frontend/
├── src/
├── pages/
├── components/
├── App.jsx
├── main.jsx
⚙️ Setup Instructions
Backend
cd backend
npm install
npm run dev

Create a .env file with:
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
Frontend
cd frontend
npm install
npm run dev

📚 API Documentation
(See below 👇)

📚 Final API Documentation
Here’s a clean table of all your backend routes:

Method Endpoint Description Access
POST /api/auth/register Register a new user Public
POST /api/auth/login Login user and get tokens Public
GET /api/auth/refresh-token Get new access token Public (with refresh token cookie)
GET /api/user/dashboard Get user dashboard data User
POST /api/user/save-feed Save a feed post User
POST /api/user/share-feed Share a feed post User
POST /api/user/spend-credits Spend credits for premium User
GET /api/admin/users Get all users Admin
PUT /api/admin/user/:id/credits Update user credits Admin
GET /api/admin/top-users Get top users by credits Admin
GET /api/admin/top-saved-feeds Get top saved posts Admin
POST /api/report/report Report a feed post User
GET /api/report/reports Get all reported posts Admin
