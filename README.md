# Work Immersion Management System

PERN Stack (PostgreSQL, Express.js, React.js, Node.js)

## Setup

### 1. Database
Create PostgreSQL database and run `server/db/schema.sql`

### 2. Backend
```bash
cd server
npm install
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Create Admin User
```sql
INSERT INTO users (email, password, first_name, last_name, role, status)
VALUES ('admin@mnhs.edu.ph', '$2b$12$RSYfsVwQJMEaoujzj235e.F9n4Gn5jpIQV2AghyvfAbAQq3L5ER3S', 'Admin', 'User', 'admin', 'approved');
```
Password: admin1234
