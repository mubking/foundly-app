# Foundly Project Bible

> Version: 1.1
> Status: Active Development
> Last Updated: August 2026

---

# 1. Introduction

Foundly is a community-powered lost and found platform that helps reunite people with their misplaced belongings through AI-powered matching, location intelligence, and community participation.

The platform allows anyone who finds an item to upload it, while owners can report missing items and receive intelligent matches.

Foundly rewards honesty by encouraging successful returns and building trust within communities.

---

# 2. Mission

To make recovering lost belongings simple, secure, and accessible for everyone.

---

# 3. Vision

Become the world's most trusted digital lost-and-found platform used by individuals, businesses, schools, airports, transport companies, and governments.

---

# 4. Problem Statement

Millions of valuable items are lost every year.

People who find them usually don't know:

- Who the owner is
- Where to report them
- How to safely return them

Owners have no centralized platform to search for their belongings.

Existing solutions are fragmented, local, or rely heavily on social media.

---

# 5. Solution

Foundly provides a centralized platform where:

- Owners report lost belongings
- Finders upload discovered items
- AI automatically suggests potential matches
- Owners verify ownership securely
- Finders receive recognition and optional rewards after a successful return

---

# 6. Core Principles

1. Trust First
2. Privacy by Default
3. Community Driven
4. AI Assists Humans
5. Fast Reporting
6. Secure Claim Verification
7. Reward Honest Behavior

---

# 7. Product Pillars

- Report Lost Items
- Upload Found Items
- AI Matching
- Secure Claims
- Community Rewards
- Reputation System
- Push Notifications
- Search

---

# 8. Target Users

## Primary

- Students
- Travelers
- Commuters
- Office Workers
- Families

## Secondary

- Universities
- Airports
- Hotels
- Shopping Malls
- Bus Companies
- Police Stations
- Businesses

---

# 9. Platforms

## Phase 1

- Android App

## Phase 2

- iOS App

## Phase 3

- Web Dashboard

---

# 10. Current Architecture

## Mobile

- React Native
- Expo
- Expo Router

## Backend

- Next.js App Router
- Route Handlers (REST API)
- JWT Authentication
- Mongoose ODM

## Database

- MongoDB Atlas

## Storage

- Cloudinary

## Authentication

- JWT (JSON Web Tokens)

## Notifications

### Current

- In-app Notifications

### Future

- Firebase Cloud Messaging (FCM)

## Maps

- Google Maps Platform

## AI

### Current

- AI-assisted matching (planned)

### Future

- OpenAI Vision Models

## Deployment

### Backend

- Vercel

### Database

- MongoDB Atlas

### Media Storage

- Cloudinary

---

# 11. Current Backend Progress

## Authentication

- [x] Register
- [x] Login
- [x] JWT Authentication
- [ ] Forgot Password
- [ ] Reset Password

---

## Lost Items

- [x] Create Lost Item
- [x] List Lost Items
- [x] Get Lost Item Details
- [x] Update Lost Item
- [x] Delete Lost Item

---

## Found Items

- [x] Create Found Item
- [x] List Found Items
- [x] Get Found Item Details
- [x] Update Found Item
- [x] Delete Found Item

---

## Claims

- [x] Submit Claim
- [x] View My Claims
- [x] Review Claim
- [x] Claim Verification

---

## Notifications

- [x] List Notifications
- [x] Mark Notification as Read
- [ ] Mark All Notifications as Read

---

## User Profile

- [ ] Get Profile
- [ ] Update Profile

---

## Uploads

- [ ] Cloudinary Upload API

---

## Maps

- [ ] Google Maps Integration

---

## Push Notifications

- [ ] Firebase Cloud Messaging

---

# 12. Mobile Progress

## Authentication

- [ ] Splash
- [ ] Onboarding
- [ ] Login
- [ ] Signup
- [ ] Forgot Password

---

## Core

- [ ] Home
- [ ] Search
- [ ] Notifications
- [ ] Chat
- [ ] Profile

---

## Lost & Found

- [ ] Report Lost
- [ ] Upload Found
- [ ] Item Details
- [ ] Claim Verification

---

## User

- [ ] My Lost Items
- [ ] My Found Items
- [ ] Rewards
- [ ] Settings

---

## Admin

- [ ] Dashboard
- [ ] Reports
- [ ] Users
- [ ] Analytics

---

# 13. Success Metrics

Measure progress using:

- Lost items reported
- Found items uploaded
- Successful AI matches
- Verified item returns
- Average claim completion time
- Monthly Active Users (MAU)
- User satisfaction
- Community reputation score

---

# 14. MVP Scope

The first release includes:

- User authentication
- Lost item reporting
- Found item reporting
- Search
- Claim system
- Notifications
- User profiles
- Basic AI matching
- Maps
- Cloud image uploads

---

# 15. Non-Goals (MVP)

The MVP will **not** include:

- Buying and selling
- Auctions
- Social media feeds
- Live video
- Group chats
- Cryptocurrency
- Complex reward systems

---

# 16. Long-Term Vision

Foundly should become the default lost-and-found platform for:

- Schools
- Universities
- Airports
- Airlines
- Hotels
- Shopping Malls
- Ride-hailing Companies
- Public Transportation
- Government Agencies
- Smart Cities

Future capabilities include:

- AI image recognition
- Smart ownership verification
- QR code recovery
- NFC support
- Organization dashboards
- Airport integrations
- Police integrations
- Multi-language support
- International recovery

---

# 17. Guiding Principle

Every feature must answer one question:

> **"Does this make returning lost items easier, faster, or more trustworthy?"**

If the answer is **no**, it should not be part of the MVP.

---

# 18. Development Roadmap

## Phase 1 — Backend MVP

- ✅ Authentication
- ✅ Lost Item APIs
- ✅ Found Item APIs
- ✅ Claims System
- ✅ Notifications
- ⏳ User Profile
- ⏳ Cloudinary Uploads
- ⏳ Google Maps
- ⏳ Push Notifications

---

## Phase 2 — Mobile MVP

- Splash
- Onboarding
- Authentication
- Home
- Report Lost
- Upload Found
- Search
- Notifications
- Profile
- My Items

---

## Phase 3 — AI Features

- Automatic image matching
- Smart recommendations
- Similar item detection
- Fraud detection
- Ownership confidence scoring

---

## Phase 4 — Organizations

- Universities
- Airports
- Hotels
- Shopping malls
- Police
- Transport operators

---

## Phase 5 — Global Expansion

- iOS
- Multi-language support
- Country-specific deployments
- Enterprise dashboards
- Public APIs

---

# 19. North Star Metric

The single most important metric for Foundly is:

> **Successfully reunited items.**

Every product decision should increase this number.

---

# 20. Founder's Promise

We believe honesty deserves better tools.

Foundly exists to make recovering lost belongings simple, secure, and trusted.

Every feature we build should help reunite people with what matters to them.

Our goal is to become the world's most trusted lost-and-found platform.