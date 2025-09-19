A URL Shortener Backend Service built with Node.js, TypeScript, PostgreSQL, Prisma, and Docker. It provides APIs to create, manage, and track shortened URLs with features like custom codes, owner verification, click tracking, and secure modification/deletion.

# Backend Setup Guide

## Requirements

### Programming Languages, Frameworks, and Tools
- Node.js
- TypeScript
- PostgreSQL
- React.js
- Shadcn
- Tailwind CSS
- Prisma
- Docker & Docker Compose

---

## Steps to Run the Backend

### 1. Install Prerequisites
- Make sure **Docker** and **Docker Compose** are installed on your system.  
- On **Windows**, ensure Docker Desktop is installed and running.

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
```
### 3. Install dependencies
```bash
npm install
# or
yarn
```
### 4. Run Docker container
```bash
docker compose up
# or run in detached (daemon) mode
docker compose up -d
```
### 5. ENVIRONMENT VARIABLE REQUIRED
For this project, for now, if you want to attach a different PostgreSQL server,  you would need to push the migration
``` env
DATABASE_URL="postgres://shortener_user:shortener123@localhost:5433/shortener"
PORT=8080
```
### 6. Prisma setup
 #### a. To use Prisma with the Prisma client.
  ```bash
    npm run generate
    # or 
    yarn generate
 ```
  #### b. FOR a new PostgreSQL connection where tables are not created(since I have already created the migration, you don't have to do anything here )
  ```bash
  npm run migrate
  # or
  yarn migrate
 ```
#### c. Optionally, verify if the table has been created in the database after running the Docker container. is not created, then migrate first
```bash
  npx prisma studio
```
#### d. In case Prisma fails to obtain the client event after the generate command, first check if there is a generated directory has been created in the project directory. If it exists, delete it first, then go to /prisma/schema.prisma. 
``` js
  generator client {
    provider = "prisma-client-js"
  }
```
Generator client should look like the above if there is any other field, like a path to the generated directory. First, remove that field, then start following 6(a).
 
### 7. Run the app in dev mode
```bash
npm run dev
# or
yarn dev
```
# DEV http://localhost:8080/shortener/<api-ends>

### 6. Run the app in production mode
  #### a. First build
  ```bash
  npm run build
  # or
  yarn build
  ```
 #### b. Then run the app
  ```bash
  npm run start
  # or
  yarn start
  ```
# Production http://localhost:8080/shortener/<api-ends>

# API ENDS, Schema and Requirements

### 1. Schema
```js
model ShortenURL {
  id          String   @id @default(uuid()) // unique id
  shortCode   String   @unique // code which has a max length of 10
  shortenURL  String // complete shortener url
  originalURL String // original url
  ownerEmail  String // owner
  secret      String // secret code for future modification of URL records
  clicks      Int // view counts
  createdAt   DateTime @default(now())  // updated at
  updatedAt   DateTime @updatedAt // created at
}
```
### 2. API ENDS and Requirements
   
### 2. API Endpoints and Requirements

#### 1. POST `/shortener/create`
This API endpoint creates a URL record.

**Requirements:**
```json
{
  "url": "string",
  "customCode": "string", // This field is optional
  "email": "string",
  "secret": "string"
}
```

**Response for Successful Creation:**
HTTP Status 200

---

#### 2. GET `/shortener/availability/:code`
This API checks the availability of a user-defined custom shortener code for the URL.

**Requirements:**
```json
{
  "code": "string" // This is in URL parameters
}
```

**Response:**
```json
{
  "isAvailable": "boolean" // true or false
}
```

---

#### 3. GET `/shortener/all`
This API fetches all URL records from the database.

**Requirements for Pagination:**
```json
{
  "page": "number" // Default is 1
  "limit": "number" // Default is 10
}
```

**Response:**
```json
[
  {
    "ownerEmail": "string",
    "shortCode": "string",
    "shortenURL": "string",
    "originalURL": "string",
    "clicks": "number"
  }
]
```

---

#### 4. POST `/shortener/validate/:code/owner`
This API verifies the record owner to ensure that no one can delete someone else's records.

**Requirements:**
**Request Parameters:**
```json
{
  "code": "string" // Short code of the URL record
}
```

**Body Parameters:**
```json
{
  "secret": "string" // User secret for the URL
}
```

**Response:**
```json
{
  "message": "authorized" // or "unauthorized"
}
```

---

#### 5. PUT `/shortener/:code`
This API updates a URL record. The user can only update the original URL, owner email, and secret.

**Requirements:**
**Request Parameters:**
```json
{
  "code": "string"
}
```

**Body Parameters:**
```json
{
  "ownerEmail": "string",
  "secret": "string",
  "originalURL": "string"
}
// Include fields for updating the owner's email, secret, and original URL.
```
#### 6. DELETE `/shortener/:code`
This API will delete the record associated with the provided short code.

**Request Parameters:**
```json
{
  "code": "string"  // The short code of the URL
}
```

#### 7. GET `/shortener/:code`
This API will retrieve a specific URL record based on the given short code.

**Request Parameters:**
```json
{
  "code": "string"  // The short code of the URL
}
```

**Response:**
```json
{
  "ownerEmail": "string",  // Owner's email address
  "secret": "string",      // URL secret (if applicable)
  "id": "string",          // Unique identifier for the URL record
  "shortedCode": "string", // Shortened code of the URL
  "shortedURL": "string",  // Shortened URL
  "createdAt": "string",   // Creation timestamp
  "updatedAt": "string"    // Last updated timestamp
}
```

#### 8. GET `/shortener/__redirect/:code`
This API will redirect users to the original link associated with the short code.

**Request Parameters:**
```json
{
  "code": "string"  // The short code used for redirection
}
```
