"""Send order confirmation mail when SMTP is configured."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_order_confirmation(*, to: str, subject: str, body: str) -> bool:
    host = settings.smtp_host.strip()
    sender = settings.smtp_from.strip() or settings.smtp_username.strip()
    if not host or not sender:
        logger.info("Order confirmation was not emailed because SMTP is not configured")
        return False
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = to
    notify = settings.order_notify_email.strip()
    if notify and notify.lower() != to.lower():
        message["Cc"] = notify
    message.set_content(body)
    try:
        with smtplib.SMTP(host, settings.smtp_port, timeout=20) as smtp:
            smtp.starttls()
            if settings.smtp_username.strip():
                smtp.login(settings.smtp_username.strip(), settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Order confirmation email failed")
        return False
    return True
