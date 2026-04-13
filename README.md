<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=30&pause=1000&color=FF4B91&center=true&vCenter=true&width=600&lines=Sarahah+App+%F0%9F%92%AC;Anonymous+Messaging+Platform;Built+with+Node.js+%2B+MongoDB" alt="Typing SVG" />

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<br/>

> **An anonymous messaging platform** where users share their profile links and receive honest, anonymous feedback — inspired by the original Sarahah concept, rebuilt from scratch with a modern, secure backend.

<br/>

[![Live API](https://img.shields.io/badge/Live%20API-sarahah--app--back--end.vercel.app-FF4B91?style=for-the-badge)](https://sarahah-app-back-end.vercel.app)
[![Postman Docs](https://img.shields.io/badge/Postman-API%20Docs-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](https://documenter.getpostman.com/view/49715513/2sBXiqFpZ5)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Data Models](#data-models)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [API Examples](#api-examples)
- [Authentication Flow](#authentication-flow)
- [Password Reset Flow](#password-reset-flow)
- [Security](#security)
- [Challenges & Learnings](#challenges--learnings)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

---

## Overview

**SarahahApp** is a full-featured anonymous messaging REST API. Users register, verify their email, and get a shareable profile link. Anyone — no account needed — can send them anonymous messages. The platform is built with production-grade security, Redis-powered OTP management, Cloudinary media storage, and full Google OAuth support.

---

## Architecture

The project follows a clean, scalable architecture designed for separation of concerns and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Any)                         │
│              Web / Mobile / Flutter / Postman               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐   │
│  │  Helmet  │  │   CORS   │  │   Rate    │  │   Joi    │   │
│  │ Headers  │  │          │  │  Limiter  │  │ Validate │   │
│  └──────────┘  └──────────┘  └───────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Router Layer                     │    │
│  │          /users                   /messages         │    │
│  └────────────────┬─────────────────────┬─────────────┘    │
│                   │                     │                   │
│  ┌────────────────▼──────┐  ┌───────────▼───────────────┐  │
│  │   Auth Middleware     │  │    Message Controller     │  │
│  │   (JWT Validation)    │  │    (Routes only)          │  │
│  └────────────────┬──────┘  └───────────┬───────────────┘  │
│                   │                     │                   │
│  ┌────────────────▼──────┐  ┌───────────▼───────────────┐  │
│  │    User Service       │  │    Message Service        │  │
│  │  (Business Logic)     │  │    (Business Logic)       │  │
│  └────────────────┬──────┘  └───────────┬───────────────┘  │
│                   │                     │                   │
│  ┌────────────────▼─────────────────────▼───────────────┐  │
│  │                   DB Service Layer                   │  │
│  │        Generic CRUD (findOne, create, update...)     │  │
│  └────────────────┬─────────────────────┬───────────────┘  │
└───────────────────│─────────────────────│────────────────────┘
                    │                     │
       ┌────────────▼──────┐  ┌───────────▼──────────┐
       │      MongoDB      │  │        Redis         │
       │ (Persistent Data) │  │  (Ephemeral Data)    │
       │  - Users          │  │  - OTP codes (2min)  │
       │  - Messages       │  │  - Revoked tokens    │
       └───────────────────┘  │  - OTP attempt count │
                              └──────────────────────┘
```

### Key Design Decisions

**Modular Architecture**
Each domain (users, messages) owns its controller (routes) and service (logic). Adding a new module means creating a new folder — nothing else breaks.

**Controller / Service / DB Separation**
- Controller: only defines routes and connects middleware
- Service: owns all business logic
- DB Service: generic reusable CRUD operations (`findOne`, `create`, `findOneAndUpdate`...) — no raw Mongoose calls scattered across the codebase

**Event-Driven Email System**
Email sending uses Node.js `EventEmitter` to decouple the signup flow from the email delivery. The HTTP response returns immediately; email fires asynchronously in the background.

```js
// Signup responds instantly, email fires in background
eventEmitter.emit("confirmEmail", async () => {
  await sendEmail({ to: email, ... });
  await set({ key: `otp::${email}`, value: hashedOtp, ttl: 120 });
});
```

**Redis for Ephemeral Data Only**
Redis is never used for persistent data. It handles only time-sensitive, short-lived state: OTP codes (2-min TTL), blocked emails (5-min TTL), and revoked JWT tokens (TTL matches token expiry). This keeps MongoDB clean and Redis lightweight.

---

## Features

### Authentication
- Email/Password Registration with OTP email verification
- Google OAuth2 sign-in via ID Token
- JWT Access Tokens (1-hour expiry) + Refresh Tokens (1-year expiry)
- Logout from single device or all devices simultaneously
- 3-step password reset flow (forget → verify OTP → reset)

### Security
- AES-256-CBC encryption for phone numbers at rest
- Bcrypt hashing (12 salt rounds) for passwords
- OTP brute-force protection via Redis attempt tracking
- Token revocation via Redis blocklist
- HTTP security headers via Helmet.js
- CORS enabled
- Global rate limiting — 50 requests / 15 minutes per IP
- Joi validation on all incoming request bodies

### User Management
- Full profile CRUD (name, gender, phone, age)
- Profile picture upload and update via Cloudinary (auto-deletes old image)
- Profile view counter with owner detection
- Public profile sharing by user ID

### Messaging
- Send anonymous messages with zero authentication required
- View received messages (authenticated owner only)
- Full inbox access

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose |
| Cache / Session | Redis |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcrypt |
| Data Encryption | Node.js crypto (AES-256-CBC) |
| Email | Nodemailer + Gmail SMTP |
| File Storage | Cloudinary |
| File Upload | Multer |
| Input Validation | Joi |
| OAuth | Google Auth Library |
| Security Headers | Helmet.js |
| Rate Limiting | express-rate-limit |
| Deployment | Vercel |

---

## Data Models

### User Model

```
users
├── firstName         String   required, 3-20 chars
├── lastName          String   required, 3-20 chars
├── userName          Virtual  firstName + " " + lastName (getter & setter)
├── email             String   required, unique
├── password          String   bcrypt hashed (system accounts only)
├── age               Number   min: 18 (system accounts only)
├── gender            Enum     male | female  (default: male)
├── provider          Enum     system | google  (default: system)
├── phone             String   AES-256-CBC encrypted
├── profilePicture    Object   { secure_url, public_id }
├── confirmed         Boolean  null until email verified
├── totalViews        Number   default: 0
├── role              Enum     user | admin  (default: user)
├── logOutTime        Date     updated on password change or full logout
└── timestamps        createdAt, updatedAt
```

### Message Model

```
messages
├── content    String      required, min 1 char
├── userId     ObjectId    ref: User (the recipient)
└── timestamps createdAt, updatedAt
```

### Entity Relationship

```
┌─────────────────────┐           ┌──────────────────────┐
│        User         │           │       Message        │
├─────────────────────┤           ├──────────────────────┤
│ _id (ObjectId) PK   │◄──────────│ userId (ObjectId) FK │
│ firstName           │  1  :  N  │ _id (ObjectId) PK    │
│ lastName            │           │ content              │
│ email               │           │ createdAt            │
│ password (hashed)   │           │ updatedAt            │
│ phone (encrypted)   │           └──────────────────────┘
│ profilePicture      │
│ confirmed           │
│ totalViews          │
│ provider            │
│ role                │
└─────────────────────┘
```

---

## Project Structure

```
sarahah-app/
├── src/
│   ├── main.js                          # Entry point
│   ├── app.controller.js                # Express app, middleware, routes
│   │
│   ├── DB/
│   │   ├── connectionDB.js              # MongoDB singleton connection
│   │   ├── db.service.js                # Generic DB operations (CRUD)
│   │   ├── models/
│   │   │   ├── user.model.js            # User schema & model
│   │   │   └── message.model.js         # Message schema & model
│   │   └── redis/
│   │       ├── redis.db.js              # Redis client & connection
│   │       └── redis.service.js         # Redis helper functions
│   │
│   ├── modules/
│   │   ├── users/
│   │   │   ├── user.controller.js       # User routes
│   │   │   └── user.service.js          # User business logic
│   │   └── messages/
│   │       ├── message.controller.js    # Message routes
│   │       └── message.service.js       # Message business logic
│   │
│   └── common/
│       ├── enum/
│       │   ├── user.enum.js             # GenderEnum, ProviderEnum, RoleEnum
│       │   └── multer.enum.js           # Allowed file types
│       ├── middleware/
│       │   ├── auth.js                  # JWT auth, visitor auth, authorization
│       │   ├── multer.js                # Cloudinary multer config
│       │   ├── schema.js                # Joi validation middleware
│       │   └── schema/
│       │       ├── auth.schema.js       # Auth validation schemas
│       │       └── message.schema.js    # Message validation schema
│       └── utils/
│           ├── cloudinary.js            # Cloudinary config
│           ├── response.success.js      # Unified success response helper
│           ├── security/
│           │   ├── hash.security.js     # bcrypt hash & compare
│           │   └── encrypt.security.js  # AES-256-CBC encrypt & decrypt
│           └── email/
│               ├── send.email.js        # Nodemailer transporter + OTP generator
│               ├── email.otp.js         # OTP send logic with rate limiting
│               ├── email.event.js       # EventEmitter for async email sending
│               └── email.template.js    # HTML email template
│
├── package.json
└── .env
```

---

## API Endpoints

### Base URL
```
https://sarahah-app-back-end.vercel.app
```

### Auth Routes — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users/signup` | No | Register new account (multipart/form-data) |
| `POST` | `/users/signup/gmail` | No | Register / Login with Google OAuth |
| `PATCH` | `/users/signup/confirm-email` | No | Verify email with OTP |
| `POST` | `/users/signup/resend_otp` | No | Resend OTP to email |
| `POST` | `/users/signin` | No | Sign in, get access + refresh tokens |
| `GET` | `/users/refreshToken` | Refresh Token | Get new access token |
| `POST` | `/users/logout` | Yes | Logout (single or all devices) |
| `GET` | `/users/profile` | Yes | Get my profile |
| `PATCH` | `/users/updateProfile` | Yes | Update name, gender, phone |
| `PATCH` | `/users/updatePassword` | Yes | Change password |
| `PATCH` | `/users/updateProfilePicture` | Yes | Upload new profile picture |
| `PATCH` | `/users/forgetPassword` | No | Step 1: Request OTP for reset |
| `POST` | `/users/confirmPassword` | No | Step 2: Verify OTP |
| `PATCH` | `/users/resetPassword` | No | Step 3: Set new password |
| `GET` | `/users/:id` | Optional | View public profile (increments view count) |

### Message Routes — `/messages`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/messages` | No | Send anonymous message to a user |
| `GET` | `/messages` | Yes | Get all my received messages |
| `GET` | `/messages/:messageId` | Yes | Get a single message by ID |

> Protected routes require a `token` header. The refresh token endpoint requires a `refreshtoken` header.

---

## API Examples

### Sign Up

```http
POST /users/signup
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|---|---|---|---|
| userName | string | Yes | 3-30 chars, letters/numbers/spaces/- /_ |
| email | string | Yes | Valid email |
| password | string | Yes | Min 8 chars |
| rePassword | string | Yes | Must match password |
| age | number | Yes | Min 18 |
| gender | string | No | `male` or `female` |
| phone | string | No | Egyptian format: 010/011/012/015 + 8 digits |
| image | file | No | PNG, JPG, JPEG |

**Response `201`**
```json
{
  "message": "done!",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "userName": "Diaa Eldeen",
    "email": "diaa@example.com",
    "age": 22,
    "gender": "male",
    "provider": "system",
    "totalViews": 0,
    "role": "user",
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

---

### Sign In

```http
POST /users/signin
Content-Type: application/json
```

```json
{
  "email": "diaa@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "message": "LogIn Succefully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Send Anonymous Message

```http
POST /messages
Content-Type: application/json
```

```json
{
  "content": "You are an amazing developer!",
  "userId": "665f1a2b3c4d5e6f7a8b9c0d"
}
```

**Response `201`**
```json
{
  "message": "Message Sent Succefully",
  "data": {
    "_id": "775f1a2b3c4d5e6f7a8b9c1e",
    "content": "You are an amazing developer!",
    "userId": "665f1a2b3c4d5e6f7a8b9c0d",
    "createdAt": "2026-04-06T10:00:00.000Z"
  }
}
```

---

### Get All My Messages

```http
GET /messages
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response `200`**
```json
{
  "message": "done!",
  "data": [
    {
      "_id": "775f1a2b3c4d5e6f7a8b9c1e",
      "content": "You are an amazing developer!",
      "userId": "665f1a2b3c4d5e6f7a8b9c0d",
      "createdAt": "2026-04-06T10:00:00.000Z"
    },
    {
      "_id": "885f1a2b3c4d5e6f7a8b9c2f",
      "content": "Keep up the great work!",
      "userId": "665f1a2b3c4d5e6f7a8b9c0d",
      "createdAt": "2026-04-06T11:00:00.000Z"
    }
  ]
}
```

---

### Validation Error (any endpoint)

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    "userName must be at least 3 characters",
    "Password must be at least 8 characters"
  ]
}
```

---

## Authentication Flow

```
┌─────────────┐    POST /signup     ┌──────────────────┐
│   Client    │ ─────────────────>  │  Create account  │
│             │  <── 201 Created    │  (unconfirmed)   │
│             │                     └────────┬─────────┘
│             │                              │ EventEmitter fires
│             │                              │ async → email sent
│             │                              ▼
│             │                     ┌──────────────────┐
│             │                     │  Redis stores    │
│             │                     │  hashed OTP      │
│             │                     │  TTL: 2 minutes  │
│             │                     └──────────────────┘
│             │
│             │  PATCH /confirm-email
│             │ ─────────────────>  ┌──────────────────┐
│             │  <── 200 Confirmed  │  Verify OTP      │
│             │                     │  Mark confirmed  │
│             │                     │  Delete OTP key  │
│             │                     └──────────────────┘
│             │
│             │  POST /signin
│             │ ─────────────────>  ┌──────────────────┐
│             │  <── token +        │  Return JWT      │
│             │      refreshToken   │  Access  (1h)    │
│             │                     │  Refresh (1y)    │
└─────────────┘                     └──────────────────┘
```

---

## Password Reset Flow

```
Step 1   PATCH /users/forgetPassword
         Body: { email }
         Action: Sends 6-digit OTP to email
         OTP valid for: 2 minutes

              │
              ▼

Step 2   POST /users/confirmPassword
         Body: { email, otp }
         Action: Verifies OTP, creates verified session in Redis
         Session valid for: 5 minutes

              │
              ▼

Step 3   PATCH /users/resetPassword
         Body: { email, newPassword, rePassword }
         Action: Updates password hash
                 Sets logOutTime → invalidates ALL existing sessions
```

---

## Security

### Threat Model & Mitigations

| Threat | Mitigation |
|---|---|
| Brute-force OTP guessing | Redis-based attempt counter: max 3 tries, then 5-minute block per email |
| OTP replay after use | OTP key deleted from Redis immediately after successful verification |
| Stolen JWT reuse after logout | Redis revocation list with TTL matching remaining token lifetime |
| Mass session hijack after password leak | `logOutTime` field — tokens issued before this timestamp are rejected server-side |
| Sensitive data exposure (phone numbers) | AES-256-CBC encryption at rest, decrypted only for the authenticated owner |
| Weak password storage | bcrypt with 12 salt rounds — computationally expensive to brute-force |
| DDoS / API abuse | express-rate-limit: 50 requests per 15 minutes per IP address |
| HTTP header attacks | Helmet.js sets CSP, X-Frame-Options, and other security headers |
| Google token forgery | ID Token verified server-side against Google's public keys via `google-auth-library` |

### OTP Rate Limiting Logic

```
Incoming OTP request
        │
        ├─► Is email blocked? (block_otp::email in Redis)
        │       YES → "Try again after N seconds"
        │
        ├─► Is current OTP still alive? (otp::email TTL > 0)
        │       YES → "Resend available after N seconds"
        │
        ├─► Has attempt count reached 3? (max_otp::email >= 3)
        │       YES → block email for 5 min → "Max attempts exceeded"
        │
        └─► Generate OTP → hash → store in Redis → increment counter → send email
```

### Token Revocation Strategy

```
Single logout:
  Store JTI in Redis → key: revoke_token::{userId}::{jti}
  TTL = remaining lifetime of the token
  Every authenticated request checks Redis before proceeding

Full logout (all devices):
  Set user.logOutTime = Date.now()
  Every token with iat < logOutTime is rejected at the middleware level
  No Redis entries needed — timestamp comparison handles everything
```

---

## Challenges & Learnings

### 1. Token Revocation in a Stateless JWT System
JWT is stateless by design — the server doesn't track issued tokens. The challenge was implementing logout (single device) without breaking that statelessness. Solution: a Redis blocklist keyed by token JTI with TTL matching the token's remaining lifetime. Revoked entries clean themselves up automatically, keeping Redis lean.

### 2. Designing OTP Expiry with Redis TTL as the Mechanism
Instead of a scheduled job or DB flag, the OTP expiry is the Redis key's TTL — when it's gone, the OTP is gone. The challenge was coordinating three separate Redis keys per email (OTP value, attempt counter, block flag) with different TTLs while keeping the logic deterministic and readable.

### 3. Decoupling Email from the Request Lifecycle
Early on, email sending was synchronous — the response waited for the email. This was slow and fragile. Refactoring to an `EventEmitter` pattern meant responses return immediately, and email fires in the background. This also means a failed email doesn't fail the signup request.

### 4. Owner Detection Without Mandatory Authentication
The profile view endpoint is public but optionally authenticated. The challenge: how do you distinguish the owner from a visitor without forcing a login? Solution: a silent `authenticationVisitor` middleware that parses the token if present but never throws. The service layer then compares `req.user?._id` to the profile ID and skips the view increment if they match.

### 5. Google OAuth vs System Account Conflict
The same email could be registered via both Google and system signup. Without a guard, this creates an account confusion vulnerability. A provider check was added: system-registered emails reject Google login attempts, and Google-registered emails reject password login attempts.

---

## Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sarahahapp

# Redis
Redis_URL=redis://localhost:6379

# Cloudinary
Cloud_Name=your_cloud_name
Api_Key=your_api_key
Api_Secret=your_api_secret

# Gmail
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_gmail_app_password
```

> Gmail requires an **App Password**. Enable 2FA on your Google account, then generate one from Google Account > Security > App Passwords.

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/sarahah-app.git
cd sarahah-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values

# 4. Start the development server
npm run dev
```

```bash
# Health check
curl http://localhost:3000/
# { "message": "Welcome In My Api" }
```

Import the Postman collection for full API testing with automated token saving.

---

## Deployment

Deployed on **Vercel** as serverless functions.

**Live:** `https://sarahah-app-back-end.vercel.app`

```bash
npm i -g vercel
vercel
vercel env add MONGO_URI
vercel env add Redis_URL
vercel env add Cloud_Name
vercel env add Api_Key
vercel env add Api_Secret
vercel env add GMAIL_USER
vercel env add GMAIL_PASS
```

---

<div align="center">

Built with care by **Eng.Diaa Eldeen**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/diaaelseady)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/diaaeldeenn)

</div>
