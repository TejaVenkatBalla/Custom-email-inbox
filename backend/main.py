from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import motor.motor_asyncio
import imaplib
import email
import os
import io
import base64
from typing import List, Optional
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Configuration
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB connection
#mongodb://admin:password123@mongodb:27017/email_app?authSource=admin
#MONGODB_URL = "mongodb://localhost:27017"

MONGODB_URL = "mongodb://admin:password123@localhost:27017/email_app?authSource=admin"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
database = client.email_app
users_collection = database.users
emails_collection = database.emails

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

app = FastAPI(title="Email Document Listing API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    size: int

class EmailItem(BaseModel):
    id: str
    sender: str
    subject: str
    timestamp: datetime
    attachments: List[EmailAttachment]
    has_attachments: bool

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

def connect_to_email(email_address: str, password: str, imap_server: str, imap_port: int):
    """Connect to email server using IMAP"""
    try:
        mail = imaplib.IMAP4_SSL(imap_server, imap_port)
        mail.login(email_address, password)
        return mail
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect to email: {str(e)}")

def fetch_emails_with_attachments(mail):
    """Fetch emails with attachments"""
    mail.select('inbox')
    
    # Search for emails with attachments
    status, messages = mail.search(None, 'ALL')
    email_ids = messages[0].split()
    
    emails = []
    # Get last 50 emails for performance
    for email_id in email_ids[-20:]:
        status, msg_data = mail.fetch(email_id, '(RFC822)')
        email_message = email.message_from_bytes(msg_data[0][1])
        
        # Extract email details
        sender = email_message.get('From', '')
        subject = email_message.get('Subject', '')
        date_str = email_message.get('Date', '')
        
        # Parse date
        try:
            timestamp = email.utils.parsedate_to_datetime(date_str)
        except:
            timestamp = datetime.now()
        
        # Check for attachments
        attachments = []
        for part in email_message.walk():
            if part.get_content_disposition() == 'attachment':
                filename = part.get_filename()
                if filename:
                    attachments.append({
                        'filename': filename,
                        'content_type': part.get_content_type(),
                        'size': len(part.get_payload(decode=True) or b''),
                        'content': base64.b64encode(part.get_payload(decode=True) or b'').decode()
                    })
        
        emails.append({
            'id': email_id.decode(),
            'sender': sender,
            'subject': subject,
            'timestamp': timestamp,
            'attachments': attachments,
            'has_attachments': len(attachments) > 0
        })
    
    return emails

# API Routes
@app.post("/api/register", response_model=dict)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Test email connection using hardcoded imap server and port, and user.password as email password
    try:
        print(user.email, user.password,type(user.password),type(user.email))
        mail = connect_to_email(user.email, user.password, "imap.gmail.com", 993)
        x= mail.select("inbox")  # Select the inbox folder
        if x[0] != 'OK':
            raise HTTPException(status_code=400, detail="Invalid email credentials")
        mail.close()
        mail.logout()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Email connection error: {str(e)}")
    
    # Hash password and save user, also save plain password for email login (note: insecure)
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "email": user.email,
        "hashed_password": hashed_password,
        "password": user.password,  # Plain password stored for email login (insecure)
        "created_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(user_doc)
    return {"message": "User registered successfully"}

@app.post("/api/login", response_model=Token)
async def login(user: UserLogin):
    # Authenticate user
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/emails", response_model=List[EmailItem])
async def get_emails(current_user: dict = Depends(get_current_user)):
    """Fetch emails for the authenticated user"""
    try:
        # Connect to user's email using hardcoded imap server and port, and stored plain password
        mail = connect_to_email(
            current_user["email"],
            current_user["password"],  # Plain password used for email login
            "imap.gmail.com",
            993
        )
        
        # Fetch emails
        emails = fetch_emails_with_attachments(mail)
        
        # Store emails in database for caching
        for email_item in emails:
            email_item["user_email"] = current_user["email"]
            await emails_collection.replace_one(
                {"id": email_item["id"], "user_email": current_user["email"]},
                email_item,
                upsert=True
            )
        
        mail.close()
        mail.logout()
        
        # Return emails without content for listing
        return [
            EmailItem(
                id=email_item["id"],
                sender=email_item["sender"],
                subject=email_item["subject"],
                timestamp=email_item["timestamp"],
                attachments=[
                    EmailAttachment(
                        filename=att["filename"],
                        content_type=att["content_type"],
                        size=att["size"]
                    ) for att in email_item["attachments"]
                ],
                has_attachments=email_item["has_attachments"]
            ) for email_item in emails
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch emails: {str(e)}")

@app.get("/api/emails/{email_id}/attachments/{filename}")
async def download_attachment(
    email_id: str,
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """Download specific attachment"""
    try:
        # Get email from database
        email_doc = await emails_collection.find_one({
            "id": email_id,
            "user_email": current_user["email"]
        })
        
        if not email_doc:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Find attachment
        attachment = None
        for att in email_doc["attachments"]:
            if att["filename"] == filename:
                attachment = att
                break
        
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        # Decode and return file
        file_content = base64.b64decode(attachment["content"])
        file_stream = io.BytesIO(file_content)
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=attachment["content_type"],
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download attachment: {str(e)}")

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }

@app.post("/api/logout")
async def logout():
    """Logout endpoint (token invalidation handled on frontend)"""
    return {"message": "Logged out successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)