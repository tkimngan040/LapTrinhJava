# ScentStation

> A multi-brand management platform for automated perfume sampling machines

Final project for the **Java Programming** course — Ho Chi Minh City University of Transport (UTH)

[Phiên bản tiếng Việt](README.md)

---

## 1. Introduction

ScentStation is a web application that allows multiple perfume brands to operate a shared network of sampling machines placed in shopping centres.

Customers select a fragrance on the machine's screen, pay by QR code, and the machine dispenses a small sample. Each brand signs in to the platform and sees only its own data: machines, bottle inventory, revenue and sales statistics.

**Note:** This project does not use physical hardware. The machine is replaced by a Java simulator that communicates with the server over a real MQTT connection.

## 2. Key Features

- Authentication and role-based access control: Administrator, Brand Manager, Staff
- Brand and fragrance catalogue management
- Machine, slot and bottle management
- Order placement and simulated QR payment
- Dispense commands sent over MQTT, cryptographically signed and time-limited
- Inventory management with low-stock alerts
- Dashboard, revenue reports and CSV export
- Failed-order handling and refund requests
- User activity audit log

## 3. System Architecture

```
┌─────────────┐     REST API     ┌─────────────┐      MQTT      ┌─────────────┐
│  Frontend   │ ───────────────> │   Backend   │ ─────────────> │  Simulator  │
│  Next.js    │ <─────────────── │ Spring Boot │ <───────────── │    Java     │
└─────────────┘                  └──────┬──────┘                └─────────────┘
                                        │
                                 ┌──────┴──────┐
                                 │ PostgreSQL  │
                                 └─────────────┘
```

## 4. Technology Stack

| Component | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16, Flyway |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Device communication | MQTT, Eclipse Mosquitto, Eclipse Paho |
| Security | JWT, BCrypt, RBAC, HMAC-SHA256 |
| Tooling | Docker, Maven, Git, GitHub Actions, Jira |

## 5. Repository Structure

```
LapTrinhJava/
├── backend/            Spring Boot application
├── frontend/           Next.js application
├── simulator/          Machine simulator
├── docs/               Report and weekly logs
│   ├── bao-cao/
│   ├── nhat-ky/
│   └── anh/
├── docker-compose.yml  PostgreSQL + Mosquitto
└── README.md
```

## 6. Getting Started

### Prerequisites

- JDK 21 (Temurin recommended)
- Node.js 20 or later
- Docker Desktop

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/tkimngan040/LapTrinhJava.git
cd LapTrinhJava

# 2. Start the database and MQTT broker
docker compose up -d

# 3. Run the backend
cd backend
./mvnw spring-boot:run
# Backend runs at http://localhost:8080
# API documentation at http://localhost:8080/swagger-ui.html

# 4. Run the frontend (in a new terminal)
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000

# 5. Run the simulator (in a new terminal)
cd simulator
./mvnw exec:java
```

## 7. Team

| Name | Role |
|---|---|
| Tran Thi Kim Ngan | Team lead, Frontend |
| Nguyen Duy Long | Fullstack and DevOps |
| Pham Tran Tra My | Backend |
| Kim Tuyen | Backend |
| Nguyen Hoai Anh | Simulator and Testing |

## 8. Working Conventions

### Branches

| Branch | Purpose |
|---|---|
| `main` | Stable releases, merged from `develop` only |
| `develop` | Integration branch |
| `feature/*`, `fix/*`, `docs/*` | Individual working branches |

Branch names always include the Jira issue key, for example `feat/SS-39-auth-jwt`.

### Commit messages

```
<type>(<Jira key>): <short description>

feat(SS-39): add JWT login API
fix(SS-45): correct order state transition
docs(SCENT-5): add technologies used section
```

Commit types: `feat`, `fix`, `docs`, `test`, `chore`.

### Workflow

1. Create a branch from `develop`
2. Complete the work and commit following the convention
3. Open a Pull Request targeting `develop`
4. Merge only after approval from at least one team member

## 9. Documentation

- [Project documents on Google Drive](https://drive.google.com/drive/folders/1dQa6OVoUEMZda-g5p1xXC_eeKa2F2zlt)
- Report and weekly logs: the `docs/` directory
- Task tracking: Jira — projects `SS` (development) and `SCENT` (report)

## 10. Licence

This project is for educational purposes.
