# Google Ads AI Plugin — Backend Structure

## Overview
Google Ads AI helps businesses plan and generate professional Google Ads campaigns using AI. Configure campaign options, generate responsive search ads, manage keywords, review campaigns, and export campaign assets through a guided onboarding workflow.

## Features
- **Account Setup Configuration**: Stores timezone, currency, website details and Customer IDs locally.
- **Demographics & Keywords Planning**: Includes target locations, target audience descriptions, age/gender scopes, target keywords, and negative keywords.
- **AI Responsive Ad Generation**: Simulates AI generation producing 15 headlines and 4 descriptions.
- **Campaign Exporters**: Supports copying ad texts and downloading as standard TXT or CSV formatted for Google Ads Editor imports.

## Workflow
1. **Welcome Screen**: Display overview.
2. **Account Setup**: Configuration fields.
3. **Campaign Builder**: Campaign targeting settings.
4. **AI Ad Copy Generator**: AI text generation options.
5. **Review & History**: Detailed summary, exports, history logs.

## Requirements
- Saadhyam AI Backend Framework.
- Local Storage persistence keys.

## Version
- **v1.0**: Onboarding campaign planner wizard (Production Ready).

## Future Roadmap (Version 2.0)
- Google OAuth authentication integration.
- Campaign publishing via Google Ads API SDK.
- Conversion tracking setup.
- Budget adjustments performance metrics dashboard.
