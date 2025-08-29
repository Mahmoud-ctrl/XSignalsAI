import os
import hmac
import json
import hashlib
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import get_jwt_identity, jwt_required
import requests
from sqlalchemy.exc import IntegrityError
from models import db, User, Transaction, WebhookEvent
import pytz
import logging

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")
lebanon_tz = pytz.timezone("Asia/Beirut")

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# BACKEND is source of truth for catalog and durations
PLAN_CATALOG = {
    # amount (USD), duration (days)
    "premium":  {"amount": 19.99,  "duration_days": 30},
    "pro":      {"amount": 29.99, "duration_days": 30},
}

# NOWPayments Configuration
NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1"
NOWPAYMENTS_API_KEY = 'T1DDVJC-SSNM5H1-MKDNBQR-V70ENFD'      # required
NOWPAYMENTS_IPN_SECRET = 'nKlo4A7ET0m2ZIWXQOvVp7p+K3XYmaRp'   # required for webhook verification
NOWPAYMENTS_SANDBOX = "true"

if NOWPAYMENTS_SANDBOX:
    NOWPAYMENTS_API_URL = "https://api-sandbox.nowpayments.io/v1"


@payments_bp.route("/available-currencies", methods=["GET"])
def get_available_currencies():
    """
    Fetch available cryptocurrencies from NOWPayments
    """
    try:
        headers = {"x-api-key": NOWPAYMENTS_API_KEY}
        r = requests.get(f"{NOWPAYMENTS_API_URL}/currencies", headers=headers, timeout=10)
        r.raise_for_status()
        currencies = r.json()["currencies"]
        
        # Filter popular currencies for better UX
        popular = ["btc", "eth", "usdttrc20", "usdterc20", "usdc", "bnb", "ltc", "trx", "doge"]
        filtered = [curr for curr in currencies if curr.lower() in popular]
        
        return jsonify({"currencies": filtered or currencies[:20]})  # fallback to first 20
    except Exception as e:
        return jsonify({"error": f"Failed to fetch currencies: {e}"}), 500


@payments_bp.route("/checkout", methods=["POST"])
@jwt_required()
def create_checkout():
    """
    Create a NOWPayments payment.
    Request JSON: { "plan": "premium", "pay_currency": "btc" }
    Returns: { payment_url, transaction_id, payment_id, pay_address, pay_amount }
    """
    if not NOWPAYMENTS_API_KEY or not NOWPAYMENTS_IPN_SECRET:
        abort(500, description="Payment configuration missing")

    data = request.get_json(silent=True) or {}
    plan = data.get("plan")
    pay_currency = data.get("pay_currency", "btc").lower()

    if plan not in PLAN_CATALOG:
        return jsonify({"error": "Invalid plan"}), 400

    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    price_usd = PLAN_CATALOG[plan]["amount"]

    headers = {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
    }
    
    payload = {
        "price_amount": price_usd,
        "price_currency": "usd",
        "pay_currency": pay_currency,
        "order_id": f"user_{user.id}_plan_{plan}_{int(datetime.now().timestamp())}",
        "order_description": f"{plan.capitalize()} plan purchase",
        "ipn_callback_url": f"https://rwanda-amount-bringing-watching.trycloudflare.com/api/payments/nowpayments/webhook",
        "success_url": f"http://localhost:5173/dashboard",
        "cancel_url": f"{request.host_url}payment/cancel",
    }

    try:
        logger.debug("Sending NOWPayments payload: %s", payload)
        r = requests.post(f"{NOWPAYMENTS_API_URL}/invoice", headers=headers, json=payload, timeout=15)
        logger.debug("NOWPayments response status: %s", r.status_code)
        logger.debug("NOWPayments response headers: %s", r.headers)
        logger.debug("NOWPayments raw response text: %s", r.text[:500])
        r.raise_for_status()
        invoice_data = r.json()
    except requests.exceptions.RequestException as e:
        logger.exception("NOWPayments request failed")
        abort(502, description=f"Failed to create invoice: {e}")
    except ValueError as e:  # JSON decoding error
        logger.exception("Failed to parse NOWPayments response as JSON")
        abort(502, description=f"NOWPayments returned invalid JSON: {r.text[:200]}")

    if not invoice_data.get("invoice_url"):
        logger.error("NOWPayments invoice response missing invoice_url: %s", invoice_data)
        abort(502, description="NOWPayments did not return an invoice_url")

    # Persist transaction
    tx = Transaction(
        user_id=user.id,
        plan=plan,
        amount_usd=price_usd,
        status="pending",
        payment_method="nowpayments",
        nowpayments_payment_id=str(invoice_data.get("id")),   # invoice id, not payment id
        pay_currency=pay_currency,
        payment_url=invoice_data.get("invoice_url"),     # redirect link
        order_id=payload["order_id"],
        created_at=datetime.now(lebanon_tz)
    )

    db.session.add(tx)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        existing = Transaction.query.filter_by(order_id=payload["order_id"]).first()
        if existing:
            tx = existing
        else:
            abort(500, description="Could not persist transaction")

    return jsonify({
        "payment_url": tx.payment_url,
        "transaction_id": tx.id,
        "payment_id": tx.nowpayments_payment_id,
        "pay_address": tx.pay_address,
        "pay_amount": tx.pay_amount,
        "pay_currency": tx.pay_currency,
        "amount_usd": tx.amount_usd,
        "plan": tx.plan,
        "order_id": tx.order_id
    }), 201


@payments_bp.route("/status/<int:transaction_id>", methods=["GET"])
@jwt_required()
def get_status(transaction_id: int):
    """
    Fetch local DB status and optionally sync with NOWPayments
    """
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    tx = Transaction.query.get(transaction_id)
    if not tx or tx.user_id != user_id:
        return jsonify({"error": "Not found"}), 404

    # Optionally sync with NOWPayments for real-time status
    if tx.nowpayments_payment_id and tx.status == "pending":
        try:
            headers = {"x-api-key": NOWPAYMENTS_API_KEY}
            r = requests.get(
                f"{NOWPAYMENTS_API_URL}/payment/{tx.nowpayments_payment_id}",
                headers=headers,
                timeout=10
            )
            if r.status_code == 200:
                payment_status = r.json().get("payment_status", "").lower()
                # Update local status based on NOWPayments status
                status_mapping = {
                    "waiting": "pending",
                    "confirming": "pending", 
                    "confirmed": "confirmed",
                    "sending": "confirmed",
                    "partially_paid": "pending",
                    "finished": "confirmed",
                    "failed": "failed",
                    "refunded": "failed",
                    "expired": "failed"
                }
                new_status = status_mapping.get(payment_status, tx.status)
                if new_status != tx.status:
                    tx.status = new_status
                    if new_status == "confirmed" and not tx.confirmed_at:
                        tx.confirmed_at = datetime.now(lebanon_tz)
                    db.session.commit()
        except Exception:
            pass  # Ignore sync errors, return local status

    return jsonify({
        "transaction_id": tx.id,
        "status": tx.status,
        "plan": tx.plan,
        "amount_usd": tx.amount_usd,
        "pay_amount": tx.pay_amount,
        "pay_currency": tx.pay_currency,
        "pay_address": tx.pay_address,
        "payment_url": tx.payment_url,
        "created_at": tx.created_at.isoformat(),
        "confirmed_at": tx.confirmed_at.isoformat() if tx.confirmed_at else None
    })


@payments_bp.route("/nowpayments/webhook", methods=["POST"])
def nowpayments_webhook():
    """
    NOWPayments IPN webhook handler with HMAC verification
    """
    print("Webhook received")
    print("Received NOWPayments webhook data:", request.data)
    # 1) Verify HMAC signature
    signature = request.headers.get("x-nowpayments-sig", "")
    raw_body = request.get_data()
    
    if NOWPAYMENTS_IPN_SECRET:
        computed_signature = hmac.new(
            NOWPAYMENTS_IPN_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(computed_signature, signature):
            abort(400, description="Invalid webhook signature")

    # 2) Parse webhook data
    try:
        webhook_data = request.get_json(force=True)
    except Exception:
        abort(400, description="Invalid JSON")

    payment_id = webhook_data.get("payment_id")
    payment_status = webhook_data.get("payment_status", "").lower()
    order_id = webhook_data.get("order_id")
    
    if not payment_id:
        abort(400, description="Missing payment_id")

    # CONVERT payment_id to string to match your database column type
    payment_id = str(payment_id)

    # 3) Idempotency check
    event_key = f"nowpayments_{payment_id}_{payment_status}"
    if WebhookEvent.query.filter_by(provider="nowpayments", event_id=event_key).first():
        return jsonify({"status": "duplicate_ignored"}), 200

    db.session.add(WebhookEvent(provider="nowpayments", event_id=event_key))

    # 4) Find transaction
    tx = Transaction.query.filter_by(nowpayments_payment_id=payment_id).with_for_update().first()
    if not tx and order_id:
        # Fallback: try to find by order_id
        tx = Transaction.query.filter_by(order_id=order_id).with_for_update().first()

    if not tx:
        # Log this but don't fail - might be a test webhook
        db.session.commit()  # Save the webhook event for idempotency
        return jsonify({"status": "transaction_not_found"}), 200

    # 5) Update transaction status
    try:
        old_status = tx.status
        
        tx.pay_address = webhook_data.get("pay_address", tx.pay_address)
        tx.pay_amount = webhook_data.get("pay_amount", tx.pay_amount) 
        tx.pay_currency = webhook_data.get("pay_currency", tx.pay_currency)

        # Map NOWPayments statuses to our internal statuses
        status_mapping = {
            "waiting": "pending",
            "confirming": "pending",
            "confirmed": "confirmed", 
            "sending": "confirmed",
            "partially_paid": "pending",
            "finished": "confirmed",
            "failed": "failed",
            "refunded": "failed",
            "expired": "failed"
        }
        
        new_status = status_mapping.get(payment_status, "pending")
        tx.status = new_status
        
        # Set confirmation timestamp
        if new_status == "confirmed" and old_status != "confirmed":
            tx.confirmed_at = datetime.now()
            
            # Update user's plan
            user = User.query.get(tx.user_id)
            if user and tx.plan in PLAN_CATALOG:
                duration = PLAN_CATALOG[tx.plan]["duration_days"]
                now = datetime.now()
                
                if tx.plan == user.tier:
                    # Same plan: extend from current expiry
                    base = user.plan_expires_at if (user.plan_expires_at and user.plan_expires_at > now) else now
                else:
                    # Different plan: start immediately, don't extend
                    base = now
                
                user.tier = tx.plan
                user.plan_expires_at = base + timedelta(days=duration)
        
        db.session.commit()
        print(f"✅ Webhook processed successfully: {payment_id} -> {new_status}")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Webhook processing error: {e}")
        abort(500, description=f"Webhook processing error: {e}")

    return jsonify({"status": "ok"}), 200


@payments_bp.route("/estimate", methods=["POST"])
def estimate_payment():
    """
    Get estimated crypto amount for a USD price
    """
    data = request.get_json(silent=True) or {}
    amount_usd = data.get("amount", 0)
    pay_currency = data.get("pay_currency", "btc").lower()
    
    if amount_usd <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    
    try:
        headers = {"x-api-key": NOWPAYMENTS_API_KEY}
        params = {
            "amount": amount_usd,
            "currency_from": "usd", 
            "currency_to": pay_currency
        }
        
        r = requests.get(f"{NOWPAYMENTS_API_URL}/estimate", headers=headers, params=params, timeout=10)
        r.raise_for_status()
        
        estimate_data = r.json()
        return jsonify({
            "estimated_amount": estimate_data.get("estimated_amount"),
            "currency": pay_currency,
            "amount_usd": amount_usd
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to get estimate: {e}"}), 500