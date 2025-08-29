import random
import string
from flask_mail import Mail, Message
import redis
from flask import render_template

class UserRegistration:
    def __init__(self, app):
        self.app = app
        self.mail = Mail(app)
        self.redis_client = redis.StrictRedis.from_url("redis://default:DqWEX2Ln31uswDcUc3iqu6IFn40vEU8n@redis-19994.c328.europe-west3-1.gce.redns.redis-cloud.com:19994", decode_responses=True)

    def generate_confirmation_code(self, length=6):
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(length))

    def send_confirmation_email(self, email, confirmation_code):
        with self.app.app_context():
            msg = Message(
                subject='Confirm Your Email',
                recipients=[email],
                # sender=("Lebwork", "contact@lebwork.net")
            )

            # Plaintext fallback
            msg.body = f"Your confirmation code is: {confirmation_code}"

            # HTML content rendered from template
            msg.html = render_template("confirmation.html", code=confirmation_code)

            try:
                self.mail.send(msg)
                # Store in Redis with a TTL (10 minutes)
                self.redis_client.setex(f"confirm_code:{email.lower().strip()}", 600, confirmation_code)
                print(f"Confirmation email sent to {email}")
            except Exception as e:
                print(f"Error sending email: {e}")

    def verify_code(self, email, code):
        key = f"confirm_code:{email.lower().strip()}"
        stored_code = self.redis_client.get(key)
        print(f"[DEBUG] Redis Key: {key}")
        print(f"[DEBUG] Stored Code: {stored_code}")
        print(f"[DEBUG] Provided Code: {code}")
        print(f"[DEBUG] Match: {stored_code == code}")
        if stored_code == code:
            self.redis_client.delete(key)
            return True
        return False
    
    def send_password_reset_email(self, email, reset_code):
        """
        Send password reset email with the reset code.
        """
        with self.app.app_context():
            msg = Message(
                subject='Reset Your Password',
                recipients=[email],
                # sender=("CryptoSignals", "noreply@cryptosignals.com")  # Update with your sender
            )

            # Plaintext fallback
            msg.body = f"""
    Password Reset Request

    You have requested to reset your password.
    Your password reset code is: {reset_code}

    This code will expire in 15 minutes.
    If you didn't request this password reset, please ignore this email.

    Best regards,
    XSignals AI Team
            """

            # HTML content rendered from template
            msg.html = render_template("reset_password.html", code=reset_code)

            try:
                self.mail.send(msg)
                # Store in Redis with a 15-minute TTL (900 seconds)
                self.redis_client.setex(f"reset_code:{email.lower().strip()}", 900, reset_code)
                print(f"Password reset email sent to {email}")
            except Exception as e:
                print(f"Error sending password reset email: {e}")

    def verify_reset_code(self, email, code):
        """
        Verify password reset code (separate from email confirmation codes).
        """
        key = f"reset_code:{email.lower().strip()}"
        stored_code = self.redis_client.get(key)
        print(f"[DEBUG] Reset Redis Key: {key}")
        print(f"[DEBUG] Stored Reset Code: {stored_code}")
        print(f"[DEBUG] Provided Reset Code: {code}")
        print(f"[DEBUG] Reset Match: {stored_code == code}")
        if stored_code == code:
            self.redis_client.delete(key)
            return True
        return False
