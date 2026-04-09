# PR Outreach Intelligence Platform

## Project Summary
PR Outreach Intelligence Platform is a full-stack application for PR teams that centralizes contacts, campaigns, and interactions while using AI to generate context-aware outreach and suggest smarter follow-ups.

The product is intentionally not a generic CRM. It is a decision-support system that helps PR professionals answer three practical questions:
- What should I say?
- When should I say it?
- Who should I say it to?

## Problem Statement
PR workflows are usually split across multiple tools:
- contact lists in spreadsheets or notes
- outreach in email clients
- campaign tracking in documents
- follow-up decisions based on manual memory

This creates:
- fragmented context
- generic messaging
- weak traceability
- limited learning from past outreach
- friction when switching between drafting, sending, and tracking

## Proposed Solution
The platform provides:
- authentication and user-owned workspaces
- contact and journalist management
- interaction logging
- campaign tracking
- AI-assisted outreach generation
- relationship scoring
- dashboard metrics
- an audit trail for key actions

## Product Principles
- simple but scalable architecture
- minimal user friction
- human review before sending
- AI used as a drafting assistant, not an autonomous sender
- structured context instead of raw free-text prompting
- real persistence in PostgreSQL
- clear separation between draft generation and email delivery

## Chosen Stack
- Frontend: Vue 3 + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Infrastructure: Docker + Docker Compose
- AI: OpenAI API or a compatible LLM provider
- Email delivery: provider abstraction, not hardcoded to one vendor

## MVP Scope

### Must Have
- sign up / login / logout
- authenticated dashboard
- CRUD for contacts
- campaign creation and participant management
- interaction logging
- AI-generated outreach drafts
- edit-and-send flow
- basic dashboard metrics

### Should Have
- contact relationship scoring
- follow-up suggestions
- saved AI draft history
- send status tracking

### Bonus
- semi-automated recommendation layer
- simple insight generation from interaction history
- campaign health indicators
- import-friendly contact onboarding

## Minimum Required Views
1. Login / Sign Up
2. Dashboard
3. Contacts
4. Campaigns
5. Outreach Draft / Send Flow
6. Activity or History view

## User Flow
1. The user signs up or logs in.
2. The user arrives at the dashboard.
3. The user creates or imports contacts.
4. The user creates a campaign and defines its objective.
5. The system validates whether enough structured context exists for generation.
6. The AI module generates a draft subject and body.
7. The user edits, saves, or discards the draft.
8. The user sends the email or schedules the send.
9. The system records the sent message and updates campaign and contact state.
10. Replies are logged back into the contact history and reflected in metrics.

## AI Design Principles
- use structured data only: contact, campaign, and recent interactions
- do not invent facts that are not present in the data
- keep the prompt versioned
- store model name and generation metadata
- let the user review before sending
- surface missing context instead of forcing a weak generation
- keep generation fast and predictable
- support regenerating subject or body independently when useful

## Backend Boundaries
The backend should be split by responsibility:
- auth and session management
- users and ownership
- contacts
- campaigns
- interactions
- AI generation and suggestion history
- outbound messaging
- dashboard metrics

## Design Principles for the Final Implementation
- clear separation of concerns
- explicit DTOs
- protected routes by default
- business logic in services, not controllers
- record important state transitions
- use database constraints to protect integrity
- prefer predictable flows over clever abstractions
- keep the first version simple enough to explain end to end during the final presentation
