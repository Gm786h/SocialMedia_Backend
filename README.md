# SocialMedia Backend

A RESTful API for a social media platform, built with **Node.js**, **Express** and **Sequelize** (MySQL). It provides user authentication, posts with image uploads, comments, likes, friend requests and one-to-one messaging.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Contributing](#contributing)

---

## Features

- **Authentication**: registration and login with bcrypt-hashed passwords and JWT tokens
- **User profiles**: current-user details and profile image upload
- **Posts**: create posts with an optional image, paginated feed, single-post view
- **Comments**: comment on posts and list comments per post
- **Likes**: toggle likes, check whether you liked a post, list a post's likes
- **Friends**: send, accept, decline and withdraw requests, auto-accept mutual requests, list friends, unfriend, search users with friendship status
- **Messaging**: send direct messages and fetch paginated chat history
- **Media storage**: images uploaded to **Cloudinary** (5 MB max)
- **Production-ready basics**: env validation on startup, Helmet security headers, configurable CORS, central error handling, graceful shutdown, health check and an automated test suite

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js 18+                         |
| Framework      | Express 4                           |
| ORM / Database | Sequelize 6 · MySQL (mysql2)        |
| Auth           | JSON Web Tokens · bcrypt            |
| Security       | Helmet · CORS                       |
| File uploads   | Multer · multer-storage-cloudinary  |
| Media hosting  | Cloudinary                          |
| Testing        | node:test · Supertest · SQLite (in-memory) |

## Project Structure

```
SocialMedia_Backend/
├── app.js                 # Express app: security, CORS, parsers, routes, error handling
├── bin/www                # Server entry point: connects to the DB, syncs tables, starts listening
├── config/
│   ├── env.js             # Loads and validates environment variables
│   ├── db.js              # Sequelize connection
│   └── cloudinary.js      # Cloudinary client
├── Controller/            # Request handlers
├── Middleware/
│   ├── auth.js            # JWT verification
│   ├── upload.js          # Image upload to Cloudinary
│   └── errorHandler.js    # 404 and error responses
├── Model/                 # Sequelize models and associations (index.js)
├── routes/                # Express routers, mounted under /api
├── scripts/sync-db.js     # Creates missing tables from the models
├── test/                  # API tests
└── utils/pagination.js    # Shared page/limit parsing
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A running **MySQL** server
- A [Cloudinary](https://cloudinary.com/) account (only needed for image uploads)

### Setup

```bash
git clone https://github.com/gm786h/SocialMedia_Backend.git
cd SocialMedia_Backend
npm install

# Create your local config and fill in the values
cp .env.example .env

# Create an empty database matching DB_NAME, e.g.
mysql -u root -p -e "CREATE DATABASE social_media"

# Start the dev server with auto-reload
npm run dev
```

Tables are created automatically on first start. The API is served at `http://localhost:3000/api`, and `GET /health` returns `{ "status": "ok" }`.

## Environment Variables

All variables are documented in [`.env.example`](.env.example).

| Variable                | Required | Description                                          |
| ----------------------- | :------: | ---------------------------------------------------- |
| `JWT_SECRET`            |    ✅    | Secret used to sign JWTs                             |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | ✅* | MySQL connection settings |
| `DATABASE_URL`          |   ✅*    | Alternative: `mysql://user:pass@host:3306/db`        |
| `PORT`                  |          | Port to listen on (default `3000`)                   |
| `NODE_ENV`              |          | `development` or `production`                        |
| `CORS_ORIGINS`          |          | Comma-separated allowed origins, or `*` (default)    |
| `JWT_EXPIRES_IN`        |          | Token lifetime (default `7d`)                        |
| `DB_SYNC`               |          | Set to `false` to skip creating tables on startup    |
| `DB_LOGGING`            |          | `true` logs SQL queries                              |
| `CLOUDINARY_CLOUD_NAME` `CLOUDINARY_API_KEY` `CLOUDINARY_API_SECRET` | | Cloudinary credentials for uploads |

\* Provide either the `DB_*` variables or `DATABASE_URL`. The server refuses to start if `JWT_SECRET` or the database settings are missing.

> **Never commit `.env` or real credentials.** `.env` is git-ignored; only `.env.example` is tracked.

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm start`       | Start the server                         |
| `npm run dev`     | Start with nodemon (auto-reload)         |
| `npm run db:sync` | Create missing tables (`-- --alter` to update existing ones) |
| `npm test`        | Run the API test suite                   |

## Testing

```bash
npm test
```

The tests run every endpoint group against an **in-memory SQLite database**, so you don't need a MySQL server or Cloudinary account to run them.

## API Reference

All endpoints are prefixed with `/api`. 🔒 marks endpoints that require `Authorization: Bearer <token>`. List endpoints accept `page` and `limit` query parameters (`limit` is capped at 100).

### Users & Profile — `/api/users`

| Method | Endpoint           | Auth | Description                                  |
| ------ | ------------------ | :--: | -------------------------------------------- |
| POST   | `/register`        |      | Register. Body: `{ name, email, password }` (password ≥ 6 chars) |
| POST   | `/login`           |      | Log in. Body: `{ email, password }`. Returns `{ token, user }` |
| GET    | `/me`              |  🔒  | Current user (without password)              |
| POST   | `/upload-profile`  |  🔒  | Upload a profile image (multipart field `image`) |
| GET    | `/profile`         |  🔒  | Current user's `id`, `name`, `email`, `profileImage` |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description                                                  |
| ------ | -------- | :--: | ------------------------------------------------------------ |
| POST   | `/`      |  🔒  | Create a post. Multipart: `content`, optional `image`        |
| GET    | `/`      |      | Feed, newest first. Returns `{ totalPages, totalPosts, posts, page }` (default `limit` 18) |
| GET    | `/:id`   |      | A post with its author, likes and comments                   |

### Comments — `/api/comments`

| Method | Endpoint   | Auth | Description                                   |
| ------ | ---------- | :--: | --------------------------------------------- |
| POST   | `/`        |  🔒  | Add a comment. Body: `{ postId, content }`    |
| GET    | `/:postId` |      | Comments for a post, oldest first             |

### Likes — `/api/likes`

| Method | Endpoint          | Auth | Description                                |
| ------ | ----------------- | :--: | ------------------------------------------ |
| POST   | `/like`           |  🔒  | Toggle like. Body: `{ postId }`            |
| GET    | `/check/:postId`  |  🔒  | Returns `{ liked }` for the current user   |
| GET    | `/:postId`        |      | Likes for a post                           |

### Friends — `/api/friends`

| Method | Endpoint               | Auth | Description                                   |
| ------ | ---------------------- | :--: | --------------------------------------------- |
| POST   | `/send`                |  🔒  | Send a request. Body: `{ receiverId }`. If that user already sent you one, you become friends immediately |
| GET    | `/received`            |  🔒  | Pending requests you received                 |
| POST   | `/accept/:requestId`   |  🔒  | Accept a request                              |
| POST   | `/cancel`              |  🔒  | Decline a received request with `{ senderId }`, or withdraw a sent one with `{ receiverId }` |
| GET    | `/list`                |  🔒  | Your friends. Returns `{ friends }`           |
| DELETE | `/unfriend/:friendId`  |  🔒  | Remove a friend                               |
| GET    | `/search`              |  🔒  | Search by name. Query: `query`. Each result has `status`: `none`, `friends`, `request_sent` or `request_received` |

### Messages — `/api/messages`

| Method | Endpoint         | Auth | Description                                         |
| ------ | ---------------- | :--: | --------------------------------------------------- |
| POST   | `/send`          |  🔒  | Send a message. Body: `{ receiverId, content }`     |
| GET    | `/:otherUserId`  |  🔒  | Chat history, newest first. Query: `page`, `limit` (default 10) |

### Example

```bash
# Log in
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'

# Create a post with an image
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <token>" \
  -F "content=Hello world" \
  -F "image=@./photo.jpg"
```

## Data Model

| Model           | Key fields                                             |
| --------------- | ------------------------------------------------------ |
| `User`          | `name`, `email` (unique), `password`, `profileImage`   |
| `Post`          | `content`, `image`, `userId`                           |
| `Comment`       | `content`, `userId`, `postId`                          |
| `Like`          | `userId`, `postId`                                     |
| `FriendRequest` | `senderId`, `receiverId`, `status` (`pending` / `accepted` / `cancelled`) |
| `Friend`        | `userId1`, `userId2`                                   |
| `Message`       | `senderId`, `receiverId`, `content`, `isRead`          |

Associations are defined in `Model/index.js`. Deleting a user cascades to their posts, comments, likes and friend requests.

## Authentication

Login returns a JWT signed with `JWT_SECRET`. Send it with every protected request:

```
Authorization: Bearer <token>
```

`Middleware/auth.js` verifies the token and sets `req.user = { id, userId }`.

## Error Handling

Errors are returned as JSON (`{ "message": "..." }`) with a matching HTTP status:

| Status | Meaning                                               |
| ------ | ----------------------------------------------------- |
| `400`  | Invalid input (missing fields, bad upload, malformed JSON) |
| `401`  | Missing, invalid or expired token; wrong credentials  |
| `403`  | Origin not allowed by CORS                            |
| `404`  | Resource or route not found                           |
| `409`  | Email already registered                              |
| `500`  | Unexpected server error (details hidden in production) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and run `npm test`
4. Commit and push: `git push origin feature/my-feature`
5. Open a pull request
