# Flower Shop MVP Monorepo

## Structure
- `apps/backend` - TypeScript API (Medusa-style MVP API for store/ops/admin)
- `apps/storefront` - Next.js storefront PWA
- `apps/ops` - Next.js ops/admin portal
- `packages/ui` - shared pastel UI-kit
- `packages/shared` - shared types

## Run
```bash
corepack enable
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/ops/.env.example apps/ops/.env.local
docker compose up -d postgres redis
pnpm --filter @flower/backend dev
pnpm --filter @flower/storefront dev
pnpm --filter @flower/ops dev
```

Or backend in docker:
```bash
docker compose up backend
```

## Seed users
- admin@flowers.local / admin123 (ADMIN)
- a@flowers.local / floristA123 (FLORIST_A)
- b@flowers.local / floristB123 (FLORIST_B)

## Key endpoints
- `POST /ops/auth/login`
- `GET /ops/orders`
- `POST /ops/orders/:id/claim`
- `POST /ops/orders/:id/confirm`
- `POST /ops/orders/:id/message`
- `GET /store/stories`
- `GET /store/stories/:id`
- `GET /store/products`
- `POST /store/orders`
- `GET /store/orders/:id`
- `POST /pay/complete`
- `CRUD /admin/pickup-points`
- `CRUD /admin/stories` + `POST /admin/stories/:id/items`
- `GET/POST /admin/users`
