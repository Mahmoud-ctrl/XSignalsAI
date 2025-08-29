import random
import string
from flask_mail import Mail, Message
import redis
from flask import render_template

class Alerts:
    def __init__(self, app=None):
        self.app = app
        self.mail = None
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize with Flask app"""
        self.app = app
        self.mail = Mail(app)

    def send_plan_renewal_alert(self, plan_name, user_email, expiry_date, days_left, base_url="https://yourdomain.com"):
        """Send plan renewal alert email"""
        if not self.mail:
            print("Mail not initialized")
            return False
            
        with self.app.app_context():
            try:
                msg = Message(
                    subject=f'⚠️ Your {plan_name} Plan Expires in {days_left} Days - Act Now!',
                    recipients=[user_email],
                    sender=("SignalsAI", "noreply@signalsai.com")  # Update with your sender
                )
                
                # Render HTML template
                msg.html = render_template(
                    "plan_renewal.html",
                    plan_name=plan_name,
                    user_email=user_email,
                    expiry_date=expiry_date,
                    days_left=days_left,
                    base_url=base_url
                )
                
                # Send email
                self.mail.send(msg)
                print(f"Renewal alert sent to {user_email} for {plan_name} plan")
                return True
                
            except Exception as e:
                print(f"Error sending renewal email to {user_email}: {e}")
                return False