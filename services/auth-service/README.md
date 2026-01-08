# Auth Service

Python Flask-based authentication service with JWT and Cognito integration.

## Development

```bash
pip install -r requirements.txt
flask run
```

## Endpoints

- `GET /health` - Health check
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
