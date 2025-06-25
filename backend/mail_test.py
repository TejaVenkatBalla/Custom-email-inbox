import imaplib
import email

imap_server: str = "imap.gmail.com"
imap_port: int = 993 
email_address: str = "tejavenkatballa@gmail.com"
password: str = "krfv axjq yfor qalo"  

def connect_to_email(email_address: str, password: str, imap_server: str, imap_port: int):
    """Connect to email server using IMAP"""
    try:
        mail = imaplib.IMAP4_SSL(imap_server, imap_port)
        mail.login(email_address, password)
        print(mail)
        mail.select("inbox")  # Select the inbox folder
        result, data = mail.search(None, 'ALL')  # Search for all emails
        if result == 'OK':
            email_ids = data[0].split()
            print(f"Number of emails: {len(email_ids)}")
            for email_id in email_ids:
                result, msg_data = mail.fetch(email_id, '(RFC822)')
                if result == 'OK':
                    msg = email.message_from_bytes(msg_data[0][1])
                    print(f"Subject: {msg['subject']}")
        else:
            print("No emails found.")
        mail.close()
        mail.logout()
    except Exception as e:
        return f"Failed to connect to email: {str(e)}"
    
connect_to_email(email_address, password, imap_server, imap_port)

