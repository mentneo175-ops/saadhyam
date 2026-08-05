# Interview Scheduler Plugin — Backend

## Overview

The Interview Scheduler plugin automates the end-to-end interview workflow for HR teams inside Saadhyam AI. It is designed to integrate with calendar providers, send candidate notifications, and give interviewers timely reminders — all from a single plugin dashboard.

## Plugin Properties

| Property | Value |
|---|---|
| Plugin Key | `hr_interview_scheduler` |
| Category | `hr` |
| Version | `v1.0` |
| Status | `Development` |
| AI Powered | `true` |
| Author | Saadhyam AI |

## Files

- `main.py` — Plugin entrypoint. Implements the `PluginMain(BasePlugin)` contract.
- `manifest.json` — Marketplace metadata and declared actions.
- `__init__.py` — Python package marker.

## Available Actions

| Action | Description | Required Parameters |
|---|---|---|
| `schedule_interview` | Schedule a new interview | `candidate_name`, `candidate_email`, `interviewer_name`, `interview_date`, `interview_time` |
| `list_interviews` | List all scheduled interviews | none (optional: `status`) |
| `cancel_interview` | Cancel an interview | `interview_id` |
| `reschedule_interview` | Move an interview to a new slot | `interview_id`, `new_date`, `new_time` |

## Configuration Fields

Stored in `UserPlugin.user_config` (JSON):

| Field | Type | Default | Description |
|---|---|---|---|
| `calendar_integrations` | array | `[]` | Calendar providers to connect (Google Calendar, Outlook) |
| `buffer_time` | number | `15` | Minutes of buffer between back-to-back interviews |
| `reminder_settings` | object | `{}` | Reminder timing and channel settings |

## Phase Roadmap

### Phase 1 — Plugin Foundation (current)
- `PluginMain` class registered and loadable by `PluginManager`
- All four actions declared in `get_actions()` so `build_tool_registry()` exposes them to the AI assistant
- `health_check()` and `execute()` return valid responses
- Plugin appears in the marketplace and can be installed

### Phase 2 — Database & API
- `Backend/models/interview_scheduler.py` — `Interview` and `InterviewSlot` SQLAlchemy models
- `Backend/schemas/interview_scheduler_schema.py` — Pydantic request/response schemas
- `Backend/routes/interview_scheduler.py` — CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`)
- Alembic migration for `interviews` and `interview_slots` tables
- Implement `schedule_interview`, `list_interviews`, `cancel_interview`, `reschedule_interview` in `main.py`

### Phase 3 — Frontend
- `Frontend/src/routes/dashboard.plugins.interview-scheduler.tsx` — layout wrapper
- `Frontend/src/routes/dashboard.plugins.interview-scheduler.index.tsx` — multi-step wizard
- Register `hr_interview_scheduler` in `PLUGIN_CONFIG_PAGES` in `PluginMarketplaceNew.tsx`
- TypeScript types and API helper functions in `pluginsApi.ts`

### Phase 4 — Assistant Integration
- Rule-based classifier entries in `assistant_service.py` for scheduling intents
- Conversational parameter collection flow (candidate → date → time → interviewer → job role)
- Follow-up question prompts and parameter validators

### Phase 5 — Calendar & Notifications
- Google Calendar OAuth integration
- Outlook / Microsoft 365 integration
- Automated candidate invite emails
- Interviewer reminder notifications
