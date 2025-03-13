# CodeDefender System Overview

## System Architecture

CodeDefender follows a modular architecture based on NestJS, with clear separation of concerns:

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   API Layer    │────▶│  Service Layer │────▶│    Data Layer  │
│  Controllers   │     │    Services    │     │  Prisma/PgSQL  │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Auth System   │     │  Queue System  │     │ External APIs  │
│  JWT/Sessions  │     │   Bull/Redis   │     │GitHub/GitLab/BB│
└────────────────┘     └────────────────┘     └────────────────┘
```

## Core Subsystems

### Authentication & Authorization

- **JWT-based** with access/refresh tokens
- **Role-based access control** (RBAC) with granular permissions
- **Plan-based feature access** tied to subscription plans

### Security Scanning Engine

- **Repository scanning** for secrets, vulnerabilities
- **Asynchronous processing** via Bull queues
- **Scheduled scans** with configurable frequency

### Multi-tenancy

- **Workspace-based** isolation
- **Role assignments** at workspace level
- **Usage tracking** per workspace/user

## Module Relationships

```mermaid
graph TD
    A[App Module] --> B[Auth Module]
    A --> C[Users Module]
    A --> D[Workspaces Module]
    A --> E[Scans Module]
    A --> F[Repositories Module]
    A --> G[Schedules Module]
    A --> H[Permissions Module]
    A --> I[Plans Module]
    A --> J[Audit Logs Module]
    
    B -.-> H
    C -.-> H
    D -.-> H
    E -.-> H
    F -.-> H
    G -.-> H
    
    E -.-> I
    D -.-> I