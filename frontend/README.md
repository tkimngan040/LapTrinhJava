# frontend — admin portal and kiosk screen

Next.js 15 with the App Router and Tailwind. Owner: **Kim Tuyen**.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npx tsc --noEmit     # types only, no build
```

## Signing in

The login screen calls the real API: `POST /api/auth/login` with
`{ username, password }`, where `username` holds the email address. The token
that comes back is kept in `sessionStorage` and sent as
`Authorization: Bearer` by `src/lib/api.ts`; a 401 from any later call clears
it and returns to the login screen.

Start the backend first, then sign in with the account the migration seeds:

```bash
docker compose up -d                 # from the repository root
cd backend && mvn spring-boot:run
```

| Email | Password |
|---|---|
| `admin@scentstation.local` | `Admin@12345` |

Development only. Change it before the application is shown to anyone outside
the team.

To work on the screens with no backend running, copy `.env.local.example` to
`.env.local` and set `NEXT_PUBLIC_USE_MOCKS=true`; the fixtures in
`src/mocks` are used instead. Leave it false for anything being demonstrated
or tested, so a forgotten flag never signs someone in against fixtures.

| Variable | Default | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Where the Spring Boot API answers |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | Sign in against `src/mocks` instead of the API |

## Roles

The backend sends the seven role names of Report section 1.4
(`PLATFORM_SUPER_ADMIN`, `BRAND_ADMIN`, `OPERATIONS_MANAGER`, `TECHNICIAN`,
`INVENTORY_STAFF`, `VIEWER`, `CUSTOMER`). The screens use the short codes
`PSA`, `BA`, `OM`, `TE`, `IS`, `VW`. `src/lib/auth-api.ts` maps between them
and is the only file that knows both spellings.

What the menu offers is a convenience, not a security boundary: the backend
checks the token's roles on every request, and a Viewer calling a write
endpoint is refused there with 403 whatever the screen shows.

## Layout

```
src/
├── app/
│   ├── login/            1 Login
│   ├── kiosk/            15 Kiosk Experience
│   └── (portal)/         dashboard, brands, users, products, machines,
│                         inventory, transactions, alerts, maintenance,
│                         reports, audit-logs
├── components/           layout/ (sidebar, header) and ui/
├── lib/                  api.ts, auth-api.ts, kiosk-api.ts, utils.ts
└── mocks/                fixtures used only when NEXT_PUBLIC_USE_MOCKS is true
```

Field names come from `docs/api-contract.md`. Money arrives as a JSON number
with two decimal places (`20000.00`): format it for display, and never compare
two amounts as strings.
