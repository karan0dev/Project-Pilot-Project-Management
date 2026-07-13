<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=6,11,20&amp;height=220&amp;section=header&amp;text=ProjectPilot&amp;fontSize=70&amp;fontColor=ffffff&amp;animation=fadeIn&amp;fontAlignY=38&amp;desc=Full-Stack%20Project%20and%20Task%20Management%20System&amp;descAlignY=58&amp;descSize=20" width="100%"/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;weight=600&amp;size=22&amp;duration=2800&amp;pause=900&amp;color=8A5CF5&amp;center=true&amp;vCenter=true&amp;multiline=true&amp;repeat=true&amp;width=700&amp;height=60&amp;lines=Glassmorphic+%2F+Claymorphic+UI+%E2%9C%A8;Node.js+%2B+Express+%2B+MongoDB+%E2%9A%99%EF%B8%8F;JWT+Auth+%2B+Real-Time+Team+Chat+%F0%9F%92%AC" alt="Typing SVG" />

<br/>

### 🔗 [**LIVE DEMO → project-pilot-project-management.onrender.com**](https://project-pilot-project-management.onrender.com/)

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Visit_App-8A5CF5?style=for-the-badge&labelColor=1a1a2e)](https://project-pilot-project-management.onrender.com/)
[![Deployed on Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://project-pilot-project-management.onrender.com/)

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

<img src="https://img.shields.io/badge/status-live-brightgreen?style=for-the-badge&amp;labelColor=1a1a2e" />

A high-fidelity, full-stack project and task management platform with a premium **glassmorphic/claymorphic** UI — built with Node.js, Express, MongoDB, and Vanilla JS.

ProjectPilot is a full-stack project management system built for planning, task tracking, analytics, and profile-based portfolio presentation. It combines a Node.js and Express API with MongoDB persistence and a polished glassmorphic/claymorphic frontend.

The application includes a premium landing page, animated login/register experience, responsive dashboard, project catalog, task workspace, analytics reports, user administration, and a profile portfolio section that showcases completed work.

[🔗 Live Demo](https://project-pilot-project-management.onrender.com/) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Project Structure](#-project-structure)

<img src="https://capsule-render.vercel.app/api?type=rect&amp;color=gradient&amp;customColorList=6,11,20&amp;height=3&amp;width=100%25"/>

</div>

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure token-based auth with role-based access control (`user` / `admin`)
- 📁 **Project Management** — Create, update, filter, and delete projects with live progress tracking
- ✅ **Task Management** — Full task CRUD with priority levels, status tracking, and deadline management
- 💬 **Team Space & Chat** — Floating team chat panel with message history, active member directory, and real-time alerts
- 🔔 **Interactive Chat Alerts** — CSS shake keyframe animations on the chat bubble and popping speech-bubble notifications showing the teammate's name and message snippet
- 👤 **Profile Dropdown Menu** — Sleek header profile card with full name support, a rotating chevron indicator, and options for *My Profile* and *Log Out*
- 💾 **Persistent Database** — Configured MongoDB replica set server to save user, team, and task records locally in the workspace `.db-data` folder across server restarts
- 📊 **Dashboard Analytics** — Real-time overview of project counts, task stats, overdue items, and team activity
- 👥 **Admin Panel** — Admin-only user management with safe cascading account deletion
- 📝 **Activity Logs** — Automatic system logging for all create/update/delete operations
- 🌗 **Theme Engine** — Dark (default) and light mode with persistent `localStorage` state
- 📱 **Responsive Design** — Glassmorphic UI with hardware-accelerated animations and mobile support

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) |
| **Password Hashing** | `bcryptjs` with 10 salt rounds |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript |
| **Styling** | Custom HSL variables, Glassmorphism, CSS Animations |

---

## 🚀 Getting Started

> 💡 **Just want to try it out?** Skip setup entirely and use the **[live deployed app](https://project-pilot-project-management.onrender.com/)** — no installation required. Note: it's hosted on Render's free tier, so the first load after inactivity may take ~30–50s to spin up.

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas URI)
- npm

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/projectpilot.git
cd projectpilot
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
```

**4. (Optional) Seed the database**

Populate the database with mock admin accounts, projects, tasks, and activity logs:
```bash
npm run seed
```

**5. Run the application**
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:5000`.

## Demo Portfolio Profile

The project includes a dedicated portfolio profile for:

```text
Name: Karandeep Singh
Email: karandeep@projectpilot.com
Password: karandeep123
```

This profile shows two completed projects and eight completed task milestones.

### SkyCast - Smart Weather Forecast Dashboard

A compact premium weather forecasting dashboard with live updates, geolocation, triple-theme support, canvas trend charts, forecast cards, shimmer search, AQI/UV indicators, and LocalStorage persistence.

Completed task milestones:

- Build compact premium weather dashboard
- Connect geolocation and live weather updates
- Create triple-theme engine and shimmer search
- Draw forecast charts and weather indicators

### EduGraph - Records Analytics Portal

A premium EdTech analytics portal for educators with CSV import, live KPI recalculation, Chart.js visual reports, student directories, profile modals, and LocalStorage persistence.

Completed task milestones:

- Design premium EduGraph welcome portal
- Implement CSV importer and analytics workspace
- Build Chart.js visual reporting suite
- Add student directory and local persistence

---

## 📁 Project Structure

```
projectpilot/
├── config/
│   └── db.js                 # MongoDB connection handler
├── controllers/
│   ├── authController.js     # Register, login, profile, password update
│   ├── projectController.js  # Project CRUD + dashboard analytics
│   ├── taskController.js     # Task CRUD + progress recalculation
│   └── userController.js     # Admin user management + cascading delete
├── middleware/
│   └── auth.js               # JWT validation + role authorization guards
├── models/
│   ├── Activity.js           # Activity log schema
│   ├── Project.js            # Project schema
│   ├── Task.js               # Task schema
│   └── User.js               # User schema (password select: false)
├── public/                   # Static frontend assets
│   ├── css/
│   │   ├── landing.css       # Landing, Login, Register page styles
│   │   └── style.css         # Authenticated dashboard styles
│   ├── js/
│   │   ├── api.js            # REST client, routing, navbar, theme engine
│   │   └── landing.js        # Landing page animations and scroll effects
│   └── *.html                # Page templates
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js
├── .env                      # Environment variables (not committed)
├── .gitignore
├── package.json
├── seed.js                   # Database seeder
└── server.js                 # App entry point
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT |
| `GET` | `/api/auth/me` | Private | Get current user profile |
| `PUT` | `/api/auth/updatepassword` | Private | Update password |

### Projects

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Private | Get all projects (filterable by status, category, search) |
| `POST` | `/api/projects` | Private | Create a new project |
| `GET` | `/api/projects/:id` | Private | Get project details + nested tasks |
| `PUT` | `/api/projects/:id` | Private | Update project details |
| `DELETE` | `/api/projects/:id` | Private | Delete project + all its tasks (cascading) |
| `GET` | `/api/projects/dashboard/stats` | Private | Dashboard analytics + 15 recent activities |

### Tasks

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Private | Get all tasks (filterable by status, priority, project, assignee) |
| `POST` | `/api/tasks` | Private | Create a task (auto-recalculates project progress) |
| `GET` | `/api/tasks/:id` | Private | Get single task with populated project & assignee |
| `PUT` | `/api/tasks/:id` | Private | Update task (recalculates progress on status change) |
| `DELETE` | `/api/tasks/:id` | Private | Delete task (auto-recalculates project progress) |

### Users (Admin Only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Private | Get all users (passwords excluded) |
| `DELETE` | `/api/users/:id` | Admin | Delete user + all projects, tasks, and assignments (cascading) |

---

## 🗄 Database Schema

```
          ┌──────────────┐
          │     USER     │◀──────────────┐
          └──────────────┘               │
            │          │                 │
            ▼          ▼                 │
     ┌───────────┐  ┌──────────────┐     │
     │  PROJECT  │  │ CHAT_MESSAGE │     │
     └───────────┘  └──────────────┘     │
        │      │                         │
        ▼      ▼                         │
     ┌──────┐ ┌──────────┐ ┌──────────────┐
     │ TASK │ │ ACTIVITY │ │ TEAM_REQUEST │
     └──────┘ └──────────┘ └──────────────┘
```

- A **User** can create many **Projects**, be assigned to many **Tasks**, send **ChatMessages**, and issue/receive **TeamRequests**.
- A **Project** contains many **Tasks**.
- All key operations log entries to **Activity** for auditing.

---

## 🔄 Core System Behaviors

### Auto Progress Calculation
Project progress is **never set manually**. It is automatically recalculated as `Math.round((completedTasks / totalTasks) * 100)` whenever a task is created, updated, or deleted under that project.

### Cascading Deletes
Deleting a **project** automatically deletes all its nested tasks. Deleting a **user** (admin action) automatically deletes their projects, nested tasks, and task assignments — wrapped in a MongoDB transaction for data integrity.

### Role-Based Access
- `user` — Can manage their own projects and tasks
- `admin` — Additional access to the `/users` management console

---

## 🔒 Security

- Passwords stored as `bcryptjs` hashes (10 rounds); the `password` field has `select: false` at the schema level and is never returned in API responses
- JWT tokens are validated on every protected request via middleware
- Admin routes are double-guarded with both `protect` and `authorize('admin')` middleware
- All cascading deletes run inside MongoDB transactions to prevent partial data corruption
- `.env` file must be kept out of version control

---

## 🙌 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 👤 Author

**Karandeep Singh**  
B.Tech — Artificial Intelligence & Machine Learning  
CGC University, Mohali

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/karan0dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/karandeepo/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

---

<div align="center">

### 🔗 Try it live: **[project-pilot-project-management.onrender.com](https://project-pilot-project-management.onrender.com/)**

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-Visit_App-8A5CF5?style=for-the-badge&labelColor=1a1a2e)](https://project-pilot-project-management.onrender.com/)

<sub>Built with ☕ and Node.js</sub>

<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=gradient&amp;customColorList=6,11,20&amp;height=120&amp;section=footer"/>

</div>
