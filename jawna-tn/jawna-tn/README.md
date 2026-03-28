# 🔥 JAWNA TN — منصة الشباب التونسي

A full-stack social media app inspired by Instagram & X (Twitter), localized for Tunisian youth.

---

## 📁 Project Structure

```
jawna-tn/
├── backend/          # Node.js + Express + Socket.io
│   ├── models/       # Mongoose schemas
│   ├── routes/       # REST API routes
│   ├── middleware/   # JWT auth middleware
│   ├── socket/       # Socket.io manager
│   ├── uploads/      # Uploaded images (auto-created)
│   └── server.js     # Entry point
└── frontend/         # React + Tailwind CSS
    └── src/
        ├── pages/    # Full page components
        ├── components/ # Shared UI components
        ├── context/  # React context (Auth)
        └── utils/    # API, Socket helpers
```

---

## ⚙️ Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm or yarn

---

## 🚀 Setup & Run

### 1. Clone / extract the project

```bash
cd jawna-tn
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🌍 Environment Variables (backend/.env)

| Variable     | Description                    | Default                              |
|-------------|--------------------------------|--------------------------------------|
| `PORT`       | Server port                    | `5000`                               |
| `MONGO_URI`  | MongoDB connection string      | `mongodb://localhost:27017/jawna-tn` |
| `JWT_SECRET` | Secret for JWT signing         | change this in production!           |
| `CLIENT_URL` | Frontend URL (CORS)            | `http://localhost:3000`              |

---

## 🏗️ Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from backend (add to server.js):
# app.use(express.static(path.join(__dirname, '../frontend/build')));
```

---

## 🔥 Features

| Feature              | Status |
|---------------------|--------|
| Register / Login     | ✅     |
| Home Feed            | ✅     |
| Create Post          | ✅     |
| Image Upload         | ✅     |
| Anonymous Posting    | ✅     |
| Reactions (😂🔥💀❤️) | ✅     |
| Comments             | ✅     |
| Trending Algorithm   | ✅     |
| Private Messages     | ✅     |
| Realtime Chat        | ✅     |
| Typing Indicators    | ✅     |
| Online Status        | ✅     |
| User Profiles        | ✅     |
| Points System        | ✅     |
| City Filter          | ✅     |
| Infinite Scroll      | ✅     |
| Mobile-first UI      | ✅     |

---

## 📊 Trending Score Formula

```
Score = (😂 × 2) + (🔥 × 3) + (💀 × 1) + (❤️ × 2)
```

---

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login

### Posts
- `GET /api/posts` — Get feed (`?sort=recent|trending&city=X&page=1`)
- `GET /api/posts/trending` — Top trending posts
- `POST /api/posts` — Create post (multipart/form-data)
- `POST /api/posts/:id/react` — React to post
- `DELETE /api/posts/:id` — Delete post

### Comments
- `GET /api/comments/:postId` — Get comments
- `POST /api/comments/:postId` — Add comment

### Messages
- `GET /api/messages/conversations` — List conversations
- `GET /api/messages/:userId` — Get chat messages
- `POST /api/messages/:userId` — Send message

### Users
- `GET /api/users/me` — Get current user
- `PUT /api/users/me` — Update profile
- `GET /api/users/search?q=` — Search users
- `GET /api/users/:id` — Get user by ID

---

## 🔌 Socket Events

| Event              | Direction       | Description              |
|-------------------|-----------------|--------------------------|
| `new_post`         | server → client | New post broadcast       |
| `reaction_update`  | server → client | Reaction counts updated  |
| `new_comment`      | server → client | New comment in post room |
| `new_message`      | server → client | New private message      |
| `user_typing`      | server → client | Typing indicator         |
| `user_stop_typing` | server → client | Stop typing indicator    |
| `user_online`      | server → client | User came online         |
| `user_offline`     | server → client | User went offline        |
| `join_post`        | client → server | Subscribe to post room   |
| `leave_post`       | client → server | Leave post room          |
| `typing`           | client → server | Notify typing            |
| `stop_typing`      | client → server | Notify stop typing       |
