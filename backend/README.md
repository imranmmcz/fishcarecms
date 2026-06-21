# FishCare Backend (Node.js + Express + MySQL)

Standalone bridge service exposing a REST API on top of MySQL, intended to run
alongside the Lovable Cloud frontend.

## Stack
- Node.js >= 18, Express 4
- `mysql2/promise` connection pool
- JWT auth (`jsonwebtoken` + `bcryptjs`)
- `helmet`, `cors`, `express-rate-limit`, `morgan`

## Quick start

```bash
cd backend
cp .env.example .env          # fill in DB_* and JWT_SECRET
npm install
mysql -u root -p < schema.sql # optional, sets up demo tables
npm run dev                   # http://localhost:4000
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Endpoints

| Method | Path                | Auth   | Description              |
|--------|---------------------|--------|--------------------------|
| GET    | /api/health         | public | DB ping + status         |
| POST   | /api/auth/register  | public | Create user, returns JWT |
| POST   | /api/auth/login     | public | Login, returns JWT       |
| GET    | /api/users/me       | bearer | Current user             |
| GET    | /api/users          | admin  | List users               |
| GET    | /api/products       | public | List active products     |
| GET    | /api/products/:id   | public | Product detail           |
| POST   | /api/products       | admin  | Create product           |

Send `Authorization: Bearer <token>` for protected routes.

## Layout

```
backend/
  server.js            Express bootstrap
  db.js                mysql2 pool + helpers
  routes/              health, auth, users, products
  middleware/          auth, error
  schema.sql           Starter MySQL schema
  .env.example         Copy to .env
```

## Managed MySQL / SSL

For PlanetScale, Aiven, RDS, etc. set `DB_SSL=true` and (if required)
`DB_SSL_CA_BASE64` to the base64-encoded CA bundle.

## Adding a route

1. Create `routes/<name>.js` exporting an Express router.
2. Register it in `routes/index.js`.
3. Use `query`, `getOne`, or `withTransaction` from `../db`.
4. Guard with `authRequired` / `requireRole("admin")` when needed.