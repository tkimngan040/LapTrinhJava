# ScentStation

> A multi-brand management platform for automated perfume sampling machines

**Java Programming** course project — Ho Chi Minh City University of Transport (UTH)


---

## 1. Introduction

ScentStation is a web application that enables multiple perfume brands to operate a shared network of sampling machines placed in shopping centres.

Customers choose a fragrance on the machine's screen, pay by QR code, and the machine dispenses a small sample. Each brand signs in to the platform and sees only its own data: machines, bottle inventory, revenue and sales statistics.

The deliverable device is a working prototype kiosk with at least four independently controlled fragrance slots. For development and automated testing, the same device tier is also realised by a Java simulator that speaks the identical MQTT contract, so the backend cannot tell the two apart. This lets the team reproduce failure scenarios that are impractical on real hardware.

## 2. Key Features

| Feature | Description |
|---|---|
| Authentication and authorisation | Seven user groups: Platform Super Administrator, Brand Administrator, Operations Manager, Technician, Inventory Staff, Viewer, and Customer (see Report §1.4) |
| Brand management | Create, update and delete brands and fragrance catalogues |
| Machine management | Track machines, slots and operating status |
| Ordering and payment | Customers select a fragrance and pay via simulated QR |
| Machine control | Send dispense commands and receive results |
| Inventory management | Track bottle stock with low-stock alerts |
| Statistics and reports | Revenue dashboard, best-selling fragrances, CSV export |
| Incident handling | Record failed orders and refund requests |

## 3. System Architecture

```
┌──────────────┐    REST API    ┌──────────────┐     MQTT     ┌──────────────┐
│   Frontend   │ ─────────────> │   Backend    │ ───────────> │   Machine    │
│   Next.js    │ <───────────── │ Spring Boot  │ <─────────── │ (simulated)  │
└──────────────┘                └──────┬───────┘              └──────────────┘
                                       │
                                ┌──────┴───────┐
                                │  PostgreSQL  │
                                └──────────────┘
```

- **Frontend**: customer-facing screens and the admin dashboard
- **Backend**: business logic, REST API, sending commands to machines
- **PostgreSQL**: data storage
- **Machine (simulated)**: receives dispense commands and reports results over MQTT

## 4. Technology Stack

| Component | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16 |
| Device communication | MQTT (Eclipse Mosquitto, Eclipse Paho) |
| Security | JWT, BCrypt, HMAC-SHA256 |
| Tools | IntelliJ IDEA, VS Code, Git, GitHub, Jira, Docker |

## 5. Repository Structure

```
LapTrinhJava/
├── backend/        Spring Boot API
├── frontend/       Next.js web and kiosk UI
├── simulator/      Java MQTT device simulator
├── Report/         Project report (chapters) and diagrams
├── Work Log/       Weekly work logs
└── README.md
```

## 6. Running the Project on Windows (VS Code + Git Bash)

This guide starts the database, MQTT broker, backend, and frontend. The
simulator is not required to start the web application.

### One-time Setup

If you already have any of these tools installed, skip the corresponding
command. Open PowerShell as an administrator and run:

```powershell
winget install EclipseAdoptium.Temurin.21.JDK
winget install Docker.DockerDesktop
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Microsoft.VisualStudioCode
```

Restart your computer if needed. Open Docker Desktop and wait until it reports
that Docker is running. If Docker requests a WSL update, run `wsl --update` in
PowerShell and then restart Docker Desktop.

Install Maven 3.9.9 from Git Bash:

```bash
cd ~
curl -L -o maven.zip https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip
unzip maven.zip && mv apache-maven-3.9.9 maven
echo 'export PATH="$HOME/maven/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verify the tools are installed:

```bash
java -version
mvn -v
node -v
docker --version
```

### Clone the Repository (One Time)

```bash
git config --global user.name "TEN_CUA_BAN"
git config --global user.email "EMAIL_GITHUB_CUA_BAN"
git clone https://github.com/tkimngan040/LapTrinhJava.git
cd ~/LapTrinhJava
code .
```

Replace the placeholder name and email with your GitHub details.

### Update the Repository

```bash
cd ~/LapTrinhJava
git checkout main
git pull
```

### Start the Application

Open three terminals in VS Code and select **Git Bash** for each one.

**Terminal 1 — Database and MQTT:** Docker Desktop must be running.

```bash
cd ~/LapTrinhJava
docker compose up -d
docker compose ps
```

**Terminal 2 — Backend:** wait for the `Started ScentStationApplication` log
message.

```bash
cd ~/LapTrinhJava/backend
mvn spring-boot:run
```

Check the backend from another terminal:

```bash
curl http://localhost:8080/actuator/health
```

The expected response is `{"status":"UP"}`.

**Terminal 3 — Frontend:**

```bash
cd ~/LapTrinhJava/frontend
npm install
npm run dev
```

Open `http://localhost:3000/login` and sign in with the development account:

| Email | Password |
|---|---|
| `admin@scentstation.local` | `Admin@12345` |

This account is for development and testing only.

### Run Tests (Optional)

```bash
cd ~/LapTrinhJava/backend
mvn test
```

### Stop the Application

Stop the backend and frontend by pressing `Ctrl+C` in Terminals 2 and 3, then
stop the database and MQTT broker:

```bash
cd ~/LapTrinhJava
docker compose down
```

## 7. Team Members

| No. | Full name | Role |
|---|---|---|
| 1 | Tran Thi Kim Ngan | Member |
| 2 | Nguyen Duy Long | Team leader |
| 3 | Pham Tran Tra My | Member |
| 4 | Kim Tuyen | Member |
| 5 | Nguyen Hoai Anh | Member |

## 8. Working Conventions

| Item | Where | Link |
|---|---|---|
| Task assignment | Jira | [ScentStation on Jira](https://ut-team-i1h68a6n.atlassian.net/jira/software/projects/SCENT/summary) |
| Report files (Word) | Google Drive | [ScentStation folder](https://drive.google.com/drive/folders/1dQa6OVoUEMZda-g5p1xXC_eeKa2F2zlt?usp=sharing) |
| Source code | GitHub | [LapTrinhJava](https://github.com/tkimngan040/LapTrinhJava) |

### Workflow

1. Pick up a task in **Jira** and move it to **In Progress**
2. Upload finished report files (Word) to **Google Drive**
3. For source code, create a branch on **GitHub** named after the Jira key, e.g. `docs/SCENT-5-technologies`
4. Open a **Pull Request**; the team leader reviews it before merging into `main`
5. Move the Jira task to **Done**

---

*This project is for educational purposes.*
