# API Gateway Service

Node.js-based API Gateway for request routing and authentication.

## Development

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `*` - Proxy to downstream services
