# TaskSync

A full-stack task management web application for creating, organizing, tracking, and managing tasks with secure user authentication and persistent cloud storage.

## 🚀 Live Demo

**Live Application:**
https://task-sync-eight-iota.vercel.app/

**GitHub Repository:**
https://github.com/mitesh02pujari-svg/TaskSync

**Backend Health API:**
https://tasksync-backend-swsk.onrender.com/api/health

---

## 📌 About the Project

**TaskSync** is a task management application developed as part of my internship project at **Thiranex**.

The application allows authenticated users to create and manage their tasks, assign priorities, track completed tasks, search and filter tasks, and maintain their task data across sessions.

The project was developed to gain practical experience with:

* Frontend application development
* React component-based architecture
* Authentication and authorization
* CRUD operations
* Database integration
* User-specific data access
* Row Level Security
* Responsive UI/UX
* Backend/server configuration
* Cloud deployment

---

## ✨ Features

### 🔐 Authentication

* User Sign Up
* User Login
* Email verification
* Secure session management
* Logout functionality
* Authentication state handling
* Protected application dashboard

### 📝 Task Management

Users can:

* Create new tasks
* Set task priority
* Mark tasks as completed
* Delete pending tasks
* Clear all pending tasks
* View completed task history
* Maintain tasks in persistent cloud storage

### 🎯 Priority Management

Each task can have one of three priority levels:

* 🔴 High
* 🟡 Medium
* 🟢 Low

Tasks can also be filtered according to their priority.

### 🔎 Search & Filtering

The dashboard provides:

* Task search by title
* Priority filtering
* Combined task organization and filtering

### 📊 Task Statistics

The dashboard displays:

* Total tasks
* Completed tasks
* Pending tasks

### 📚 Completed Task History

Completed tasks are moved to a separate history section.

The application displays the most recent completed tasks while maintaining completed task data in the database.

### 📱 Responsive Design

TaskSync is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile devices

The interface adapts to different screen sizes while maintaining usability.

### 🎨 User Interface

The application includes:

* Clean light-themed interface
* Dashboard layout
* Task cards
* Priority badges
* Search and filter controls
* Loading states
* Empty states
* Confirmation modal for clearing tasks
* Responsive navigation and controls
* Accessible form labels and buttons

---

## 🛠️ Technology Stack

### Frontend

* **React** — UI development
* **JavaScript** — Application logic
* **JSX** — Component markup
* **CSS** — Styling and responsive design
* **Vite** — Development server and build tool

### Backend

* **Node.js**
* **Express.js**
* **CORS**
* **dotenv**

The Express server currently provides the backend server layer and health endpoint.

### Database & Authentication

* **Supabase**
* **PostgreSQL**
* **Supabase Authentication**
* **Row Level Security (RLS)**

### Deployment

* **Vercel** — Frontend deployment
* **Render** — Express backend deployment
* **Supabase** — Database and authentication

---

## 🏗️ Application Architecture

```text
                    ┌──────────────────────┐
                    │      User / Browser  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite App   │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
          ┌─────────────────┐    ┌──────────────────┐
          │ Supabase Auth   │    │ Supabase Client  │
          │ Authentication  │    │ Task Operations  │
          └─────────────────┘    └────────┬─────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │   PostgreSQL DB  │
                                │  Tasks + RLS     │
                                └──────────────────┘


          ┌──────────────────────┐
          │ Node.js + Express    │
          │ Backend Server       │
          └──────────┬───────────┘
                     │
                     ▼
              Health/API Layer
```

### Data Flow

```text
User
  ↓
React UI
  ↓
Supabase Client
  ↓
Supabase Authentication
  ↓
Authenticated User Session
  ↓
PostgreSQL
  ↓
Row Level Security
  ↓
User-specific Tasks
```

> **Note:** The current application uses Supabase directly from the React frontend for authentication and task CRUD operations. The Express backend is deployed separately and currently provides the server/API layer, including the health endpoint.

---

## 🔒 Authentication & Authorization

TaskSync uses **Supabase Authentication** for user accounts and sessions.

The application supports:

1. User registration
2. Email confirmation
3. Login
4. Session management
5. Logout
6. Protected dashboard access

The application checks the current authentication session before displaying the task dashboard.

Unauthenticated users are shown the authentication interface instead of the task dashboard.

---

## 🛡️ Database Security

TaskSync uses **Row Level Security (RLS)** on the PostgreSQL `tasks` table.

Each task contains a `user_id` that identifies its owner.

The database policies ensure that an authenticated user can:

* View their own tasks
* Create their own tasks
* Update their own tasks
* Delete their own tasks

Users cannot access another user's task records through the database policies.

### Task Table

The main `tasks` table contains:

| Column         | Type        | Description             |
| -------------- | ----------- | ----------------------- |
| `id`           | bigint      | Unique task identifier  |
| `user_id`      | uuid        | Authenticated user's ID |
| `title`        | text        | Task title              |
| `priority`     | text        | High, Medium, or Low    |
| `completed`    | boolean     | Completion status       |
| `created_at`   | timestamptz | Task creation time      |
| `completed_at` | timestamptz | Completion time         |

---

## 🔄 Task Lifecycle

```text
              ┌───────────────┐
              │ Create Task   │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Pending Task  │
              └───────┬───────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
       Complete Task       Delete Task
             │                 │
             ▼                 ▼
      Completed History       Removed
```

When a task is completed:

* `completed` becomes `true`
* `completed_at` is recorded
* The task moves from pending tasks to completed history

---

## 📂 Project Structure

```text
TaskSync/
│
├── backend/
│   ├── config/
│   │   └── supabase.js
│   │
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── components/
│   │   └── Auth.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── lib/
│   │   └── supabase.js
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .env.local
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/mitesh02pujari-svg/TaskSync.git
```

### 2. Navigate into the project

```bash
cd TaskSync
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Configure backend environment variables

Create:

```text
backend/.env
```

Add:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_server_side_secret_key
```

### 6. Configure frontend environment variables

Create:

```text
.env.local
```

Add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> Never commit `.env` or `.env.local` files containing real credentials or secret keys.

### 7. Start the frontend

From the project root:

```bash
npm run dev
```

The Vite development server will start locally.

### 8. Start the backend

Open another terminal:

```bash
cd backend
npm run dev
```

The Express server will run on port `5000`.

---

## 🧪 Testing

The application was manually tested for:

* User registration
* Email verification
* Login
* Logout
* Task creation
* Task priority selection
* Task completion
* Task deletion
* Clear-all functionality
* Search
* Priority filtering
* Completed history
* Database persistence
* Page refresh persistence
* Responsive layouts
* Mobile layout
* Authentication state handling

The production deployment was also tested using the live Vercel application.

---

## 🚀 Deployment

### Frontend — Vercel

The React/Vite frontend is deployed using Vercel.

**Production URL:**

https://task-sync-eight-iota.vercel.app/

Production deployment is connected to the GitHub `main` branch.

### Backend — Render

The Node.js/Express backend is deployed using Render.

**Backend URL:**

https://tasksync-backend-swsk.onrender.com

**Health endpoint:**

https://tasksync-backend-swsk.onrender.com/api/health

Expected response:

```json
{
  "message": "TaskSync API is running"
}
```

### Database — Supabase

Supabase provides:

* PostgreSQL database
* User authentication
* Database security
* Row Level Security
* Persistent task storage

---

## 🔐 Environment Variables

### Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Backend

```env
PORT=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

The actual environment values are intentionally excluded from the repository.

---

## 📸 Screenshots

### Authentication

*Add login/sign-up screenshot here.*

### Dashboard

*Add main TaskSync dashboard screenshot here.*

### Task Management

*Add task creation and priority screenshot here.*

### Search & Filters

*Add search/filter screenshot here.*

### Completed History

*Add completed history screenshot here.*

### Mobile Responsive View

*Add mobile screenshot here.*

---

## 📈 Future Improvements

Possible future improvements include:

* Real-time task synchronization
* Task editing
* Due dates and reminders
* Task categories/tags
* Drag-and-drop task organization
* More advanced task sorting
* Notifications
* Team/shared task management
* Improved analytics
* Progressive Web App support

---

## 🎓 Internship Context

This project was developed as **Task 2** of my internship at **Thiranex**.

The project focused on applying concepts related to:

* Full-stack application structure
* Authentication
* Authorization
* CRUD operations
* Database integration
* API/server configuration
* Dynamic data handling
* Responsive web development
* Cloud deployment

---

## 👨‍💻 Developer

**Mitesh Pujari**

B.Tech — Electronics and Computer Engineering

GitHub:
https://github.com/mitesh02pujari-svg

LinkedIn:
https://www.linkedin.com/in/mitesh-pujari-132631385

---

## 📄 License

This project was developed as an internship project and for educational/portfolio purposes.
