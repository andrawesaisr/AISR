# AISR - Project Management Platform

A full-stack project management platform with organization management, team collaboration, and task tracking capabilities.

## 🚀 Features

### Authentication & Authorization
- User registration and login with JWT authentication
- Email-based invitation system for team members
- Role-based access control (Owner, Admin, Member)

### Organization Management
- Create and manage multiple organizations
- Organization-level settings and configuration
- Member management with role assignments
- Invitation system with email notifications

### Project Management
- Create and organize projects within organizations
- Project-level team assignments

### Task Management
- Create, update, and delete tasks
- Task assignment to team members
- Priority levels and status tracking
- Drag-and-drop task reordering across columns
- Task descriptions and metadata

### Document Management
- Create and edit documents with rich text editor
- Document organization within projects
- Real-time document editing interface

### Team Collaboration
- Team member management
- Role-based permissions
- Activity tracking and notifications

## 🛠️ Tech Stack

### Backend (Server)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **CORS**: Enabled for cross-origin requests

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS
- **UI Components**: Custom components with Lucide icons
- **Drag & Drop**: @dnd-kit and react-beautiful-dnd
- **Rich Text Editor**: React Quill
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Build Tool**: Webpack 5

## 📁 Project Structure

```
aisr/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── layout/   # Layout components (Sidebar, Layout)
│   │   │   ├── projects/ # Project-related components
│   │   │   └── tasks/    # Task components (NewTaskForm)
│   │   ├── context/      # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── OrganizationContext.tsx
│   │   ├── pages/        # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── OrganizationsPage.tsx
│   │   │   ├── OrganizationPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectPage.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   ├── DocumentPage.tsx
│   │   │   ├── TeamPage.tsx
│   │   │   └── InvitePage.tsx
│   │   ├── services/     # API service layer
│   │   │   └── api.ts
│   │   ├── styles/       # Global styles
│   │   ├── App.tsx       # Main app component
│   │   └── index.tsx     # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── webpack.config.js
│   └── tailwind.config.js
│
└── server/                # Express backend application
    ├── src/
    │   ├── models/       # Mongoose models
    │   │   ├── User.ts
    │   │   ├── Organization.ts
    │   │   ├── Project.ts
    │   │   ├── Task.ts
    │   │   ├── Document.ts
    │   │   └── Invitation.ts
    │   ├── routes/       # API routes
    │   │   ├── auth.ts
    │   │   ├── organizations.ts
    │   │   ├── projects.ts
    │   │   ├── tasks.ts
    │   │   ├── documents.ts
    │   │   └── invitations.ts
    │   ├── middleware/   # Express middleware
    │   │   └── auth.ts
    │   ├── utils/        # Utility functions
    │   │   └── email.ts
    │   └── server.ts     # Server entry point
    ├── package.json
    └── tsconfig.json
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aisr
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/aisr
   JWT_SECRET=your_jwt_secret_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   ```

4. **Build and start the server**
   ```bash
   npm run build
   npm start
   
   # Or for development with auto-reload:
   npm run dev
   ```

5. **Set up the client**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the client**
   ```bash
   npm start
   
   # Or build for production:
   npm run build
   ```

The application will be available at:
- **Client**: http://localhost:3000
- **Server**: http://localhost:5000

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Organizations
- `GET /api/organizations` - Get all organizations for user
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `POST /api/organizations/:id/members` - Add member to organization
- `DELETE /api/organizations/:id/members/:userId` - Remove member

### Projects
- `GET /api/projects/organization/:orgId` - Get all projects in organization
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks/project/:projectId` - Get all tasks in project
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/reorder` - Reorder task

### Documents
- `GET /api/documents/project/:projectId` - Get all documents in project
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Invitations
- `POST /api/invitations` - Send invitation
- `GET /api/invitations/:token` - Get invitation details
- `POST /api/invitations/:token/accept` - Accept invitation

## 🎨 UI Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean and intuitive interface with TailwindCSS
- **Drag & Drop**: Intuitive task management with drag-and-drop functionality
- **Rich Text Editing**: Full-featured document editor
- **Toast Notifications**: Real-time feedback for user actions
- **Protected Routes**: Automatic redirection for unauthorized access

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes with middleware
- Role-based access control
- Secure invitation system
- CORS configuration

## 📝 Development

### Server Development
```bash
cd server
npm run dev  # Runs with nodemon for auto-reload
```

### Client Development
```bash
cd client
npm start  # Runs webpack dev server with hot reload
```

## 🏗️ Building for Production

### Server
```bash
cd server
npm run build  # Compiles TypeScript to JavaScript
npm start      # Runs the compiled code
```

### Client
```bash
cd client
npm run build  # Creates optimized production build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC

## 👤 Author

Andrawes

---

**Note**: This is a work in progress. More features and improvements are coming soon!

## ✅ E2E Testing with Playwright

High-confidence regression coverage is provided via Playwright. Tests launch both the React client and Express API against a dedicated MongoDB database.

### One-time setup

```bash
cd client
npm install --save-dev @playwright/test
npx playwright install
```

### Resetting the E2E database

```bash
cd server
MONGODB_URI=mongodb://127.0.0.1:27017/aisr_e2e npm run db:reset:e2e
```

### Running the suite

```bash
cd client
MONGODB_URI=mongodb://127.0.0.1:27017/aisr_e2e npm run test:e2e
```

Helpful aliases:

- `npm run test:e2e:headed` – watch tests in a real browser.
- `npm run test:e2e:ui` – open the Playwright test explorer.

### CI tips

- The bundled `playwright.config.ts` launches the client dev server (port 3000) and API (port 5001) automatically.
- Always point tests at an isolated MongoDB schema (defaults to `aisr_e2e`).
- Traces and screenshots are captured on failure by default for quick triage.
