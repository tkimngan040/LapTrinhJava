## 3.2. Source Code Structure

> Draft for task **L6** (Long). Merge into `Report/03.Implementation and
> Testing.md` once the package tree has settled, and replace the two figure
> placeholders with screenshots taken from the IDE.

The repository holds three source projects, matching the three tiers of the
architecture in Section 2.8.1, plus the shared documents the team works from.

```
LapTrinhJava/
├── backend/        Spring Boot: REST API and IoT gateway
├── simulator/      Java: the device tier
├── frontend/       Next.js: admin portal and kiosk screen
├── docs/           API contract and test plan
├── Report/         This report and its figures
└── Work Log/       Weekly logs, one file per member
```

*Figure 3.x. Project structure as shown in the IDE.*

### 3.2.1. Layering

Section 2.8.2 requires calls to flow in one direction only:

| Layer | Responsibility | May call |
|---|---|---|
| Controller | HTTP: parse the request, shape the response | Service |
| Service | Business rules and transaction boundaries | Repository |
| Repository | Persistence, one interface per aggregate | Entity |
| Entity | State and the invariants that belong to it | — |

A controller never reaches a repository directly, and an entity never depends
on a service. The package layout below makes a breach of that rule visible on
sight rather than something a reviewer has to go looking for.

### 3.2.2. Packages organised by business area

```
vn.edu.uth.scentstation
├── ScentStationApplication.java
├── config/              Clock, bound configuration properties
├── common/              BaseEntity, ApiException, ApiError, GlobalExceptionHandler
├── security/            JWT, roles, tenant isolation
├── iot/                 MQTT gateway, topics, command signing
└── domain/
    ├── brand/           Tenants
    ├── user/            Accounts, roles, sign-in
    ├── catalog/         Products, machines, slots, locations
    ├── order/           Order state machine, ordering, payment
    ├── dispensing/      Dispensing commands and their results
    ├── inventory/       Batches, bottles, stock movements
    ├── alert/           Alerts and notifications
    ├── maintenance/     Tickets and checklists
    ├── audit/           Audit log
    └── report/          Dashboards and reports
```

The obvious alternative was to put `controller/`, `service/` and `repository/`
at the top level. With ten functional areas and twenty-three tables, those
three folders would each have grown to several dozen files, and reading one
flow end to end would mean jumping between three places.

Organising by business area instead makes each `domain/*` package a vertical
slice holding its own entity, repository, service and controller. Two
consequences matter for a team of five working in parallel. Each member owns a
few packages outright, so Git conflicts are rare. And the layering still
holds — it simply lives inside each package rather than above them all.

The ownership map is recorded in `OWNERS.md` at the repository root, so that
"who should change this file" never needs to be asked.

### 3.2.3. The IoT gateway sits apart but shares the services

`iot/` is deliberately outside `domain/`. It subscribes to the MQTT topics,
validates each inbound message, converts it to Java objects, and then calls
the same service a REST controller would call. It contains no business rule of
its own.

This follows Section 2.8.2 directly: *"There is therefore exactly one
implementation of each business rule, regardless of whether it is reached from
the web or from a device."* Stock is deducted by `InventoryService` whether the
spray was confirmed by a device result or corrected by an operator, and an
order changes state only through `OrderStateMachine` whichever direction the
request came from.

It also halves the work in Section 3.6: an integration test exercises one path
through the rules rather than two parallel ones that have to be kept in step.

### 3.2.4. Three classes exist in both projects

`Topics`, `CanonicalJson` and `CommandSigner` are duplicated, byte for byte,
in the backend and in the simulator.

The duplication is intentional. These three define the wire contract between
the two processes: the topic names, the exact string that gets signed, and the
HMAC over it. Sharing them through a library would make the simulator depend
on the backend's build, which would undermine the point of the simulator being
an independent device. Keeping two copies that must stay identical is the
smaller cost, and the class comment on each says so, because a silent drift
between them makes every command fail its signature check for reasons that
point nowhere near the cause.

### 3.2.5. Statistics

| Measure | Value |
|---|---|
| Java source files | *(fill in at submission)* |
| Lines of Java | *(fill in)* |
| Packages | 16 |
| Entities | *(fill in)* |
| Database migrations | 4 |
| REST endpoints | *(fill in)* |

*Figure 3.x. The `vn.edu.uth.scentstation` package tree.*
