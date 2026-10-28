# Code ownership

Check this file before creating new files. If you need to change something in
someone else's area, tell the team first rather than letting them discover it
at merge time.

| Path | Owner | Role |
|---|---|---|
| `backend/.../security/`, `config/`, `common/` | **Long** | Core backend |
| `backend/.../domain/order/`, `domain/dispensing/`, `iot/` | **Long** | Core backend |
| `backend/.../domain/brand/`, `user/`, `inventory/`, `alert/`, `maintenance/`, `audit/`, `report/` | **Hoai Anh** | Business backend |
| `backend/.../domain/catalog/` | **Tra My** | Database |
| `backend/src/main/resources/db/migration/` | **Tra My** | Database |
| every `*Entity.java` and `*Repository.java` | **Tra My** | Database |
| `simulator/` | **Long** (core) and **Kim Ngan** (FaultInjector) | |
| `frontend/` | **Kim Tuyen** | Frontend |
| `backend/src/test/` | **Kim Ngan** | Tester |
| `docs/test-plan.md` | **Kim Ngan** | Tester |
| `docs/api-contract.md` | **everyone** — announce any change | |
| `Report/03.Implementation and Testing.md` | 3.1 Tra My · 3.2 Long · 3.3 Hoai Anh · 3.4 Kim Tuyen · 3.5–3.7 Kim Ngan | |
| `Report/Diagram_image/Ch3/` | **Kim Tuyen** | screenshots for 3.4 |
| `Work Log/` | each member edits only their own file | |

## How two people share one package

Two people work inside the same business package: Tra My writes the Entity and
Repository classes, the package owner writes the Service and Controller
classes. Because these are separate files, Git never reports a conflict.

## Branches and pull requests

```bash
git checkout main && git pull
git checkout -b feat/long-SCENT-63-jwt        # feat/<name>-<jira key>-<topic>
# ... write code ...
git add . && git commit -m "feat(security): JWT login and role-based access control"
git push -u origin feat/long-SCENT-63-jwt
```

Open a pull request on GitHub. One teammate reviews it before it is merged into
`main`. Never push directly to `main`.

Commit prefixes: `feat:` new feature · `fix:` bug fix · `docs:` documentation ·
`test:` tests · `chore:` housekeeping.

A clean commit history is also evidence for Chapter 4 on how the team worked.
