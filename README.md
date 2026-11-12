# SocialMedia Backend

A RESTful API for a social media platform, built with **Node.js**, **Express** and **Sequelize** (MySQL). It provides user authentication, posts with image uploads, comments, likes, friend requests and one-to-one messaging.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [Contributing](#contributing)

---

## Features

- **Authentication**: registration and login with hashed passwords (bcrypt) and JWT access tokens
- **User profiles**: profile retrieval and profile image upload
- **Posts**: create posts with an optional image, list posts with pagination, fetch a single post
- **Comments**: comment on posts and list comments per post
- **Likes**: like a post, check whether the current user liked it, list a post's likes
- **Friends**: send, accept and cancel friend requests, list friends, unfriend, search users
- **Messaging**: send direct messages and fetch paginated chat history
- **Media storage**: images are uploaded to **Cloudinary** through Multer

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js                             |
| Framework      | Express 4                           |
| ORM / Database | Sequelize 6 · MySQL                 |
| Auth           | JSON Web Tokens · bcrypt            |
| File uploads   | Multer · multer-storage-cloudinary  |
| Media hosting  | Cloudinary                          |
| Utilities      | dotenv · cors · morgan · nodemon    |

## Project Structure

```
SocialMedia_Backend/
├── app.js                # Express app setup, middleware, route mounting
├── bin/www               # HTTP server entry point
├── config/
│   ├── db.js             # Sequelize connection and sync
│   └── cloudinary.js     # Cloudinary config (currently unused)
├── Controller/           # Request handlers (User, Post, Comment, Like, FriendRequest, Message, Profile)
├── Middleware/
│   ├── auth.js           # JWT verification
│   └── upload.js         # Multer + Cloudinary storage
├── Model/                # Sequelize models and associations (index.js)
├── routes/               # Express routers, mounted under /api
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A running **MySQL** server
- A [Cloudinary](https://cloudinary.com/) account (for image uploads)

### Installation

```bash
# Clone the repository
git clone https://github.com/gm786h/SocialMedia_Backend.git
cd SocialMedia_Backend

# Install dependencies
npm install

# Install the MySQL driver used by Sequelize (if not already installed)
npm install mysql2
```

### Configuration

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)), and create an empty MySQL database matching `DB_NAME`. Tables are created automatically on startup through `sequelize.sync()`.

### Run

```bash
npm start
```

The API is served at `http://localhost:3000/api` by default.

## Environment Variables

| Variable                | Description                         | Example         |
| ----------------------- | ----------------------------------- | --------------- |
| `PORT`                  | Port the server listens on          | `3000`          |
| `DB_HOST`               | MySQL host                          | `localhost`     |
| `DB_PORT`               | MySQL port                          | `3306`          |
| `DB_USER`               | MySQL user                          | `root`          |
| `DB_PASSWORD`           | MySQL password                      |                 |
| `DB_NAME`               | MySQL database name                 | `social_media`  |
| `JWT_SECRET`            | Secret used to sign JWTs            | a long random string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name               |                 |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                  |                 |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret               |                 |

> **Never commit your `.env` file.** It is listed in `.gitignore`; keep real credentials out of version control.

## API Reference

All endpoints are prefixed with `/api`. 🔒 marks endpoints that require an `Authorization: Bearer <token>` header.

### Users & Profile — `/api/users`

| Method | Endpoint           | Auth | Description                                  |
| ------ | ------------------ | :--: | -------------------------------------------- |
| POST   | `/register`        |      | Register. Body: `{ name, email, password }`  |
| POST   | `/login`           |      | Log in and receive a JWT. Body: `{ email, password }` |
| GET    | `/me`              |  🔒  | Get the current user                         |
| POST   | `/upload-profile`  |  🔒  | Upload a profile image (multipart field `image`) |
| GET    | `/profile`         |  🔒  | Get the current user's profile               |

### Posts — `/api/posts`

| Method | Endpoint | Auth | Description                                                  |
| ------ | -------- | :--: | ------------------------------------------------------------ |
| POST   | `/`      |  🔒  | Create a post. Multipart: `content`, optional `image`        |
| GET    | `/`      |      | List posts. Query: `page`, `limit`                           |
| GET    | `/:id`   |      | Get a post by ID                                             |

### Comments — `/api/comments`

| Method | Endpoint   | Auth | Description                                   |
| ------ | ---------- | :--: | --------------------------------------------- |
| POST   | `/`        |  🔒  | Add a comment. Body: `{ postId, content }`    |
| GET    | `/:postId` |      | List comments for a post                      |

### Likes — `/api/likes`

| Method | Endpoint          | Auth | Description                                |
| ------ | ----------------- | :--: | ------------------------------------------ |
| POST   | `/like`           |  🔒  | Like a post. Body: `{ postId }`            |
| GET    | `/check/:postId`  |  🔒  | Check whether the current user liked a post |
| GET    | `/:postId`        |      | List likes for a post                      |

### Friends — `/api/friends`

| Method | Endpoint               | Auth | Description                                   |
| ------ | ---------------------- | :--: | --------------------------------------------- |
| POST   | `/send`                |  🔒  | Send a request. Body: `{ receiverId }`        |
| GET    | `/received`            |  🔒  | List received requests                        |
| POST   | `/accept/:requestId`   |  🔒  | Accept a request                              |
| POST   | `/cancel`              |  🔒  | Cancel a sent request. Body: `{ receiverId }` |
| GET    | `/list`                |  🔒  | List friends. Query: `page`, `limit`          |
| DELETE | `/unfriend/:friendId`  |  🔒  | Remove a friend                               |
| GET    | `/search`              |  🔒  | Search users. Query: `query`                  |

### Messages — `/api/messages`

| Method | Endpoint         | Auth | Description                                         |
| ------ | ---------------- | :--: | --------------------------------------------------- |
| POST   | `/send`          |  🔒  | Send a message. Body: `{ receiverId, content }`     |
| GET    | `/:otherUserId`  |  🔒  | Chat history with a user. Query: `page`, `limit`    |

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
| `FriendRequest` | `senderId`, `receiverId`, status                       |
| `Friend`        | user-to-user friendship                                |
| `Message`       | `senderId`, `receiverId`, `content`, `isRead`          |

Associations are defined in `Model/index.js`. A user has many posts, comments, likes, friend requests and messages, and deleting a user cascades to their content.

## Authentication

On successful login the API returns a JWT signed with `JWT_SECRET`. Send it with every protected request:

```
Authorization: Bearer <token>
```

The `Middleware/auth.js` middleware verifies the token and attaches `req.user = { id, userId }` for downstream handlers.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push the branch: `git push origin feature/my-feature`
5. Open a pull request
