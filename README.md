# Project Submission & Review Dashboard — Backend

A REST API backend for a project submission and review dashboard. Students register, log in, and submit their projects (one submission per student). Admins can review submissions (approve or reject with a reason), list and search all submissions, and view submission statistics.

Built with **Express 5**, **TypeScript**, **Prisma 7**, and **PostgreSQL**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Documentation](#api-documentation)
  - [Health Check](#health-check)
  - [Users](#users)
  - [Auth](#auth)
  - [Submissions](#submissions)
- [Data Models](#data-models)
- [Scripts](#scripts)

---

## Features

- User registration with password hashing (`bcryptjs`)
- JWT-based login (access + refresh tokens) delivered via HTTP-only cookies and JSON
- Role-based access control (`STUDENT` / `ADMIN`)
- Account status enforcement (`ACTIVE` / `BLOCKED`)
- Students can submit exactly one project and view their submission
- Admins can list submissions with search, filtering, sorting, and pagination
- Admins can approve or reject submissions (rejection requires a reason)
- Submission statistics (total, pending, approved, rejected)
- Automatic tester admin seeding on server start
- Centralized error handling and consistent API responses

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express 5 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL |
| Auth | JSON Web Tokens (`jsonwebtoken`), `cookie-parser` |
| Validation | Zod |
| Password Hashing | bcryptjs |
| Dev Tooling | tsx (watch mode), dotenv |

---

## Project Structure

```
.
├── prisma/
│   ├── migrations/              # Database migration history
│   └── schema/                  # Split Prisma schema (schema, user, submission, enums)
├── prisma7.config.ts            # Prisma 7 configuration
├── generated/prisma/            # Generated Prisma Client (do not edit)
├── src/
│   ├── app.ts                   # Express app setup, middleware, route mounting
│   ├── server.ts                # Server bootstrap (DB connect + admin seed + listen)
│   └── app/
│       ├── config/              # Environment config loader
│       ├── interfaces/          # Shared interfaces (IQuery)
│       ├── lib/prisma.ts        # Prisma client with PG adapter
│       ├── middlewares/
│       │   ├── checkAuth.ts     # JWT authentication & role authorization
│       │   ├── globalErrorHandler.ts
│       │   └── notFound.ts
│       ├── modules/
│       │   ├── auth/            # Login (controller, service, route, types)
│       │   ├── users/           # Register (controller, service, route, types)
│       │   └── submission/      # Submit, list, review, stats
│       └── utils/               # AppError, catchAsync, jwt, sendResponse, seed
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or any Postgres-compatible URL)

### Installation

```bash
git clone <repository-url>
cd Project-submission-and-review-dashboard-backend
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Fill in the values described in [Environment Variables](#environment-variables).

### Set up the database

```bash
npx prisma migrate deploy   # apply existing migrations
npx prisma generate         # generate Prisma Client into ./generated/prisma
```

For a fresh development database you can use `npx prisma migrate dev` instead of `migrate deploy`.

### Run the server

```bash
npm run dev     # development with watch mode (tsx)
```

Production:

```bash
npm run build
npm start
```

On startup the server connects to the database, seeds a tester admin (if it does not already exist), and listens on `PORT` (default `5000`).

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | No | `development` or `production` (controls error detail) |
| `PORT` | No | Server port (default `5000`) |
| `APP_URL` | Yes | Allowed CORS origin for the frontend |
| `BCRYPT_SALT_ROUNDS` | Yes | Salt rounds for password hashing |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_ACCESS_EXPIRATION` | Yes | Access token lifetime (e.g. `1d`, `15m`) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRATION` | Yes | Refresh token lifetime (e.g. `7d`) |
| `TESTER_ADMIN_NAME` | Yes | Name of the auto-seeded admin |
| `TESTER_ADMIN_EMAIL` | Yes | Email of the auto-seeded admin |
| `TESTER_ADMIN_PASSWORD` | Yes | Password of the auto-seeded admin |

Example:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/submission_db"
NODE_ENV="development"
PORT=5000
APP_URL="http://localhost:3000"

BCRYPT_SALT_ROUNDS=10

JWT_ACCESS_SECRET="your-access-secret"
JWT_ACCESS_EXPIRATION="1d"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"

TESTER_ADMIN_NAME="Tester Admin"
TESTER_ADMIN_EMAIL="admin@example.com"
TESTER_ADMIN_PASSWORD="admin123"
```

---

## Authentication

Login returns an `accessToken` and a `refreshToken` in the JSON body and also sets them as HTTP-only cookies.

Protected endpoints accept the access token in **either** way:

```http
Cookie: accessToken=<token>
```

or

```http
Authorization: Bearer <token>
```

Access is role-based:

- `STUDENT` — submit a project, view own submission
- `ADMIN` — list/review submissions, view statistics

A `BLOCKED` user is denied access with `403 Forbidden`. Roles are re-checked against the database on every request.

> Note: there is currently no refresh-token or logout endpoint. The refresh token is issued and stored in a cookie only.

---

## Response Format

Successful responses follow this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```

`meta` is only present for paginated endpoints.

---

## Error Handling

Errors are returned with an appropriate HTTP status code:

```json
{
  "success": false,
  "statusCode": 404,
  "name": "Not Found",
  "message": "Submission not found.",
  "error": {},
  "stack": "..."
}
```

In `production`, `name`, `message`, `error`, and `stack` are sanitized (generic message, no internals). Prisma errors such as duplicate keys, foreign key failures, and connection issues are mapped to meaningful HTTP codes.

Common status codes:

| Code | Meaning |
| --- | --- |
| `400` | Validation / bad request |
| `401` | Missing or invalid token, wrong password |
| `403` | Insufficient role or blocked account |
| `404` | Resource or route not found |
| `409` | Duplicate email or already-submitted/reviewed conflict |
| `500` | Internal server error |

---

## API Documentation

**Base URL:** `http://localhost:5000`

All API routes are prefixed with `/api/v1`.

### Health Check

#### `GET /`

Returns a plain-text welcome message.

**Response** — `200 OK`

```
Welcome to simple project submission and review dashboard
```

---

### Users

#### `POST /api/v1/user/register`

Register a new user. New users are created with role `STUDENT` and status `ACTIVE`.

**Access:** Public

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Full name |
| `email` | string | Yes | Unique email |
| `password` | string | Yes | Plain-text password (hashed server-side) |

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response** — `201 Created`

```json
{
  "success": true,
  "statusCode": 201,
  "message": "user created successfully",
  "data": {
    "id": "3f1c2a9e-...",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "phone": null,
    "userRole": "STUDENT",
    "useStatus": "ACTIVE",
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:00:00.000Z"
  }
}
```

> The password is never returned.

**Errors**

- `409 Conflict` — A user with this email already exists.

---

### Auth

#### `POST /api/v1/auth/login`

Authenticate a user and issue tokens.

**Access:** Public

**Request Body**

| Field | Type | Required |
| --- | --- | --- |
| `email` | string | Yes |
| `password` | string | Yes |

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged successfully",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

Also sets cookies:

- `accessToken` — HTTP-only, `SameSite=None`, max age 1 day
- `refreshToken` — HTTP-only, `SameSite=None`, max age ~7 days

**Errors**

- `401 Unauthorized` — Password is incorrect.
- `404 Not Found` — No user with that email (raised by Prisma `findUniqueOrThrow`, mapped by the global handler).

---

### Submissions

#### `POST /api/v1/submission/submit`

Submit a project. A student can have **only one** submission.

**Access:** `STUDENT`

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `projectName` | string | Yes | Name of the project |
| `projectLiveLink` | string | Yes | Live/deployed URL |
| `githubLink` | string | Yes | GitHub repository URL |
| `description` | string | Yes | Project description |

```json
{
  "projectName": "Task Manager",
  "projectLiveLink": "https://task-manager.example.com",
  "githubLink": "https://github.com/jane/task-manager",
  "description": "A full-stack task management app built with React and Express."
}
```

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Project Submitted",
  "data": {
    "id": "a1b2c3d4-...",
    "projectName": "Task Manager",
    "projectLiveLink": "https://task-manager.example.com",
    "githubLink": "https://github.com/jane/task-manager",
    "description": "A full-stack task management app built with React and Express.",
    "status": "PENDING",
    "reviewedById": null,
    "reviewedAt": null,
    "rejectReason": null,
    "createdAt": "2026-10-23T10:05:00.000Z",
    "updatedAt": "2026-10-23T10:05:00.000Z",
    "studentId": "3f1c2a9e-..."
  }
}
```

**Errors**

- `401 Unauthorized` — Missing or invalid token.
- `403 Forbidden` — Not a student / account blocked.
- `409 Conflict` — You have already submitted your assignment.

---

#### `GET /api/v1/submission/my-submission`

Retrieve the logged-in student's submission.

**Access:** `STUDENT`

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "My Submissions retrieved successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "projectName": "Task Manager",
    "projectLiveLink": "https://task-manager.example.com",
    "githubLink": "https://github.com/jane/task-manager",
    "description": "A full-stack task management app built with React and Express.",
    "status": "PENDING",
    "reviewedById": null,
    "reviewedAt": null,
    "rejectReason": null,
    "createdAt": "2026-10-23T10:05:00.000Z",
    "updatedAt": "2026-10-23T10:05:00.000Z",
    "studentId": "3f1c2a9e-..."
  }
}
```

**Errors**

- `404 Not Found` — You have not submitted any project yet.

---

#### `GET /api/v1/submission/all-submissions`

List all submissions with search, status filter, sorting, and pagination.

**Access:** `ADMIN`

**Query Parameters**

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `searchTerm` | string | — | Case-insensitive search on `projectName` and `description` |
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` | — | Filter by submission status |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page |
| `sortBy` | string | `createdAt` | Field to sort by |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction |

**Example Request**

```http
GET /api/v1/submission/all-submissions?searchTerm=task&status=PENDING&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <admin-token>
```

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All Submissions retrieved successfully",
  "data": {
    "data": [
      {
        "id": "a1b2c3d4-...",
        "projectName": "Task Manager",
        "projectLiveLink": "https://task-manager.example.com",
        "githubLink": "https://github.com/jane/task-manager",
        "description": "A full-stack task management app built with React and Express.",
        "status": "PENDING",
        "reviewedById": null,
        "reviewedAt": null,
        "rejectReason": null,
        "createdAt": "2026-10-23T10:05:00.000Z",
        "updatedAt": "2026-10-23T10:05:00.000Z",
        "studentId": "3f1c2a9e-..."
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

> Pagination metadata is nested inside `data` for this endpoint.

---

#### `PATCH /api/v1/submission/review-submission/:submissionId`

Approve or reject a pending submission. Only submissions with status `PENDING` can be reviewed.

**Access:** `ADMIN`

**Path Parameters**

| Param | Type | Description |
| --- | --- | --- |
| `submissionId` | UUID | ID of the submission to review |

**Request Body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | `APPROVED` \| `REJECTED` | Yes | Review decision |
| `rejectReason` | string | Required when `REJECTED` | Reason for rejection |

Approve example:

```json
{
  "status": "APPROVED"
}
```

Reject example:

```json
{
  "status": "REJECTED",
  "rejectReason": "The live link is not accessible and the README is missing."
}
```

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Submission approved successfully.",
  "data": {
    "id": "a1b2c3d4-...",
    "projectName": "Task Manager",
    "projectLiveLink": "https://task-manager.example.com",
    "githubLink": "https://github.com/jane/task-manager",
    "description": "A full-stack task management app built with React and Express.",
    "status": "APPROVED",
    "reviewedById": "9c8b7a6d-...",
    "reviewedAt": "2026-10-23T11:00:00.000Z",
    "rejectReason": null,
    "createdAt": "2026-10-23T10:05:00.000Z",
    "updatedAt": "2026-10-23T11:00:00.000Z",
    "studentId": "3f1c2a9e-...",
    "student": {
      "id": "3f1c2a9e-...",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "reviewedBy": {
      "id": "9c8b7a6d-...",
      "name": "Tester Admin",
      "email": "admin@example.com"
    }
  }
}
```

**Errors**

- `400 Bad Request` — Invalid submission ID or invalid body (`rejectReason` missing when rejecting).
- `404 Not Found` — Submission not found.
- `409 Conflict` — This submission has already been reviewed.

---

#### `GET /api/v1/submission/submission-stats`

Get aggregate submission counts by status.

**Access:** `ADMIN`

**Response** — `200 OK`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Submission statistics retrieved successfully.",
  "data": {
    "total": 12,
    "PENDING": 5,
    "APPROVED": 4,
    "REJECTED": 3
  }
}
```

---

## Data Models

### User

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `email` | string | Unique |
| `name` | string | |
| `password` | string | Bcrypt hash, never exposed |
| `phone` | string \| null | Optional |
| `userRole` | `STUDENT` \| `ADMIN` | Default `STUDENT` |
| `useStatus` | `ACTIVE` \| `BLOCKED` | Default `ACTIVE` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Submission

| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `projectName` | string | |
| `projectLiveLink` | string | Live URL |
| `githubLink` | string | Repository URL |
| `description` | string | |
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` | Default `PENDING` |
| `reviewedById` | UUID \| null | Reviewer (admin) |
| `reviewedAt` | DateTime \| null | Review timestamp |
| `rejectReason` | string \| null | Set when rejected |
| `studentId` | UUID | Unique — one submission per student |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Relationships:

- `User.projectSubmission` → the student's single `Submission`
- `User.reviewedSubmissions` → submissions reviewed by an admin
- `Submission.student` → submitting student
- `Submission.reviewedBy` → reviewing admin

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start in development with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm test` | Placeholder (no tests configured) |

Useful Prisma commands:

```bash
npx prisma generate          # regenerate the client
npx prisma migrate dev       # create + apply a migration (development)
npx prisma migrate deploy    # apply pending migrations (production)
npx prisma studio            # open Prisma Studio
```

---

## License

ISC
