# User Service

Python Flask-based user management service.

## Development

```bash
pip install -r requirements.txt
flask run
```

## Endpoints

- `GET /health` - Health check
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user
