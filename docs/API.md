# API Documentation

Base URL: `http://localhost:5000/api`

## Auth

- `POST /auth/signup` - `{ name, email, password }`
- `POST /auth/login` - `{ email, password }`
- `POST /auth/google` - `{ idToken }`
- `POST /auth/forgot-password` - `{ email }`
- `POST /auth/reset-password` - `{ email, token, newPassword }`
- `GET /auth/me` - Bearer token required

## Resume

- `POST /resumes/upload` - multipart form-data with `resume` file
- `GET /resumes` - list user resumes
- `GET /resumes/:id` - get single resume

## Analysis

- `POST /analyses` - `{ resumeId, roleTitle?, company?, jobDescription }`
- `GET /analyses?page=1&limit=10`
- `GET /analyses/:id`

## Dashboard

- `GET /dashboard`

## User

- `PUT /users/profile` - `{ name?, headline?, avatarUrl?, skills?[] }`
- `GET /users/notifications`

## Admin (admin role)

- `GET /admin/overview`
- `GET /admin/users`

## Common Response

- Success: JSON payload with data object
- Errors: `{ message, errors? }`
