# Email Document Listing Application

## Project Overview
This project is a full-stack email document listing application consisting of a FastAPI backend, a React frontend, and a MongoDB database. The backend connects to users' email accounts via IMAP to fetch emails and attachments, caches them in the database, and exposes RESTful APIs for the frontend. The frontend provides a user interface for registration, login, viewing emails, and downloading attachments.

## Docker Setup
The project uses Docker Compose to orchestrate three main services:

- **mongodb**: MongoDB 7.0 database service with authentication enabled. It stores user data and cached emails.
- **backend**: FastAPI backend service built from the `backend` directory. It connects to MongoDB and handles API requests.
- **frontend**: React frontend service built from the `frontend` directory. It depends on the backend service.

### Running the Project with Docker
1. Ensure Docker and Docker Compose are installed on your machine.
2. From the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The services will be available at:
   - Frontend: `http://localhost:8080`
   - Backend API: `http://localhost:8000`
   - MongoDB exposed on port `27017` (for development purposes)

## Database Schema

### Users Collection
Each user document contains:
- `email` (string): User's email address (unique).
- `hashed_password` (string): Bcrypt hashed password.
- `password` (string): Plain password stored for IMAP login (note: this is insecure and should be improved).
- `created_at` (datetime): Timestamp of user registration.

### Emails Collection
Each email document contains:
- `id` (string): Email unique identifier.
- `user_email` (string): Email address of the user owning this email.
- `sender` (string): Email sender address.
- `subject` (string): Email subject line.
- `timestamp` (datetime): Date and time the email was received.
- `attachments` (array): List of attachments, each with:
  - `filename` (string)
  - `content_type` (string)
  - `size` (int)
  - `content` (base64 string)
- `has_attachments` (boolean): Whether the email has attachments.

## API Endpoints

### Authentication
- `POST /api/register`  
  Register a new user. Requires email and password. Validates email credentials via IMAP.

- `POST /api/login`  
  Login user and receive a JWT access token.

- `POST /api/logout`  
  Logout endpoint (token invalidation handled on frontend).

### User
- `GET /api/user/profile`  
  Get the current authenticated user's profile.

### Emails
- `GET /api/emails`  
  Fetch emails for the authenticated user. Requires Bearer token.

- `GET /api/emails/{email_id}/attachments/{filename}`  
  Download a specific attachment from an email. Requires Bearer token.

## Authentication Details
- Uses JWT tokens signed with HS256 algorithm.
- Access tokens expire after 30 minutes.
- Passwords are hashed with bcrypt for storage.
- Authentication is done via HTTP Bearer tokens.
- User registration validates email credentials by connecting to the IMAP server.
- Note: Plain passwords are stored for IMAP login, which is insecure and should be improved in production.

## Notes
- MongoDB credentials and JWT secret key are hardcoded for development and should be secured in production.
- The backend connects to Gmail's IMAP server (`imap.gmail.com`) on port 993 for email fetching.
- CORS is enabled to allow frontend access.
