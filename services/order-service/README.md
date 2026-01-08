# Order Service

Node.js-based order management service with DynamoDB.

## Development

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health` - Health check
- `GET /orders/{id}` - Get order by ID
- `GET /orders?user_id={id}` - Get orders by user
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order
