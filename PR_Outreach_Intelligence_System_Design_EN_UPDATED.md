# System Design / Scaffolding

## Product Goal
Build a PR outreach intelligence platform that helps teams manage contacts, campaigns, and outreach with AI-assisted drafting, while keeping human review in the loop and minimizing friction.

The system is not a generic CRM. It is a decision-support tool focused on three questions:
- What should I say?
- Who should I say it to?
- When should I follow up?

## High-Level Architecture
Frontend (Vue 3 + TypeScript + Vite)
→ REST API (Node.js + Express + TypeScript)
→ PostgreSQL
→ AI provider / LLM service
→ Email provider / outbound delivery layer

## Core Product Flow
1. The user signs up or logs in.
2. The user lands on the dashboard and sees onboarding state or recent activity.
3. The user creates or imports contacts.
4. The user creates a campaign and defines its objective.
5. The system collects structured contact data, campaign context, and interaction history.
6. The AI module generates a draft subject and body based on that structured context.
7. The user reviews and edits the draft before sending.
8. The backend records the sent message as an interaction and stores the AI suggestion lifecycle.
9. The dashboard updates with contact activity, campaign progress, and response metrics.

## Backend Modules

### 1. auth
Responsible for:
- sign up
- login
- logout
- session / refresh token handling
- password hashing and verification
- protecting routes
- resolving the current user

### 2. users
Responsible for:
- retrieving the current user profile
- updating basic account settings
- managing ownership and workspace scope if the product grows beyond a single-user MVP

### 3. contacts
Responsible for:
- creating contacts
- listing contacts
- retrieving contact details
- updating contact data
- soft deleting or archiving contacts
- exposing or calculating a relationship score
- tracking last contact date and outreach readiness

### 4. interactions
Responsible for:
- logging sent emails
- logging received replies
- storing manual notes or follow-up events when needed
- retrieving interaction history for a contact or campaign
- keeping an audit trail of what actually happened

### 5. campaigns
Responsible for:
- creating campaigns
- listing campaigns
- updating campaign metadata
- associating contacts with campaigns
- retrieving campaign participants
- tracking campaign status and outreach progress

### 6. ai
Responsible for:
- collecting structured context from contacts, campaigns, and interactions
- validating that enough context exists before generating
- building the prompt from normalized data, not free-form text
- generating subject and body drafts
- returning editable outreach content with optional rationale or suggestions
- storing AI suggestion history and usage state

### 7. messaging
Responsible for:
- sending outbound emails through the provider
- retrying failed sends when appropriate
- recording send status
- linking provider message ids to local interaction records

### 8. dashboard
Responsible for:
- summary metrics
- recent activity
- pending drafts
- campaign health
- response rate and outreach volume

## Architecture Decisions

### Vue 3 + TypeScript + Vite
Chosen for fast iteration, a clean component model, and a strong fit for dashboard-heavy interfaces.

### Node.js + Express + TypeScript
Chosen for low friction, predictable control, and enough structure for a one-month MVP without introducing framework overhead.

### PostgreSQL
Chosen for relational integrity, strong joins, and a domain that naturally depends on users, contacts, campaigns, interactions, and generated suggestions.

### Docker
Required to keep environments reproducible and to satisfy bootcamp constraints.

### AI Provider Abstraction
The AI layer should not be tied directly to one vendor. The app should use an internal provider interface so the model can change without rewriting business logic.

### Human-in-the-Loop AI
AI may generate drafts and recommendations, but the user always reviews before sending. The system should assist, not auto-act in a risky way.

## Backend Structure
src/
├── app.ts
├── server.ts
├── config/
│   ├── db.ts
│   └── env.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── dto/
│   ├── users/
│   ├── contacts/
│   │   ├── contacts.controller.ts
│   │   ├── contacts.service.ts
│   │   ├── contacts.repository.ts
│   │   └── dto/
│   ├── interactions/
│   ├── campaigns/
│   ├── ai/
│   ├── messaging/
│   └── dashboard/
└── shared/
    ├── middlewares/
    ├── utils/
    ├── types/
    ├── errors/
    └── validators/

## Database Schema

### users
- id
- email
- password_hash
- role
- created_at
- updated_at

### auth_sessions
- id
- user_id
- refresh_token_hash
- expires_at
- revoked_at
- user_agent
- ip_address
- created_at

### contacts
- id
- user_id
- name
- email
- outlet
- topics
- relationship_score
- last_contacted_at
- archived_at
- created_at
- updated_at

### interactions
- id
- user_id
- contact_id
- campaign_id
- direction
- channel
- status
- subject
- content
- provider_message_id
- external_thread_id
- occurred_at
- metadata
- created_at

### campaigns
- id
- user_id
- name
- description
- objective
- status
- created_at
- updated_at

### campaign_contacts
- id
- campaign_id
- contact_id
- status
- assigned_at
- last_outreach_at
- created_at

### ai_suggestions
- id
- user_id
- contact_id
- campaign_id
- subject
- body
- status
- model
- prompt_version
- used_at
- rejected_at
- rejection_reason
- created_at
- updated_at

### audit_events
- id
- user_id
- entity_type
- entity_id
- action
- metadata
- created_at

## API Flow Notes

### Authentication
Every protected request resolves the current user from a session or access token. All contact, campaign, interaction, and AI records are scoped by user ownership.

### Draft Generation
The AI endpoint should:
1. validate the request
2. load contact + campaign + recent interactions
3. build a structured context payload
4. generate a draft
5. store the suggestion as a draft record

### Send Flow
Sending should be a separate action from generation. This prevents accidental sends and gives the user a chance to edit the draft.

### Relationship Score
The score can be computed from recent interactions, reply frequency, recency, and campaign participation. It may be cached in the database, but the calculation logic should remain centralized.

## Scalability Guidelines
- keep controller, service, and repository layers separate
- use explicit DTOs and validation schemas
- keep business logic out of route handlers
- scope every record to the authenticated user
- store configuration in environment variables
- version prompt templates
- build prompts from structured context, not raw free text
- persist AI suggestion status so the app can learn from usage
- keep send and generation steps separate
- log important actions for debugging and auditability
