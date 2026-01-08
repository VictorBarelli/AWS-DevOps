# Notification Service

Python Flask-based notification service with SNS/SES integration.

## Development

```bash
pip install -r requirements.txt
flask run
```

## Endpoints

- `GET /health` - Health check
- `POST /notifications/email` - Send email
- `POST /notifications/sms` - Send SMS
