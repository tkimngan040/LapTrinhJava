# frontend — Next.js admin portal and kiosk UI

Owner: **Kim Tuyen**. Created in task **T1**.

Run with `npm install && npm run dev` → http://localhost:3000

| Path | Screen | Task |
|---|---|---|
| `src/app/login` | 1 Login | T1 |
| `src/app/kiosk/[deviceId]` | 15 Kiosk Experience | T2 |
| `src/app/(portal)/products`, `/machines` | 6, 7 | T3 |
| `src/app/(portal)/dashboard`, `/reports` | 2, 13 | T4 |
| `src/app/(portal)/transactions`, `/inventory` | 8, 9 | T5 |
| remaining | 3, 4, 5, 10, 11, 12 | T7 (stretch) |

`src/lib/api.ts` attaches the JWT automatically and redirects to the login page
on a 401.

**Do not wait for the backend.** Agree the JSON field names in
`docs/api-contract.md`, build against mock data shaped the same way, then swap
in the real URL.
