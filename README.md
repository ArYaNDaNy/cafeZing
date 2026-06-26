# 🍽️ CafeZing

> A cloud-native canteen management system that replaces physical queues with real-time digital ordering, live kitchen tracking, and push notifications — built for campus canteens.

---

## The Problem

College canteen queues are chaotic. Students wait in line not knowing how long their order will take, kitchen staff have no visibility into incoming orders, and the whole process runs on paper tokens and shouting. CafeZing replaces all of that with a digital ecosystem that gives everyone — students, kitchen staff, and admins — exactly the information they need, in real time.

---

## Architecture

CafeZing uses a deliberately decoupled cloud-native stack. The key design decision was separating high-frequency live data (queue positions, order status) from permanent data (orders, receipts, menu) so that real-time activity never puts load on the primary database.

```
┌─────────────────────────────────────────────────────┐
│              React Native + Expo (Frontend)          │
│         Android / iOS — Bluetooth, FCM, Payments     │
└───────────────────┬─────────────────────────────────┘
                    │ REST + WebSockets
┌───────────────────▼─────────────────────────────────┐
│            FastAPI Backend (Python)                  │
│                    Dockerised                        │
└────────┬──────────────────────────┬─────────────────┘
         │                          │
┌────────▼────────┐      ┌──────────▼──────────┐
│   PostgreSQL     │      │   Upstash Redis      │
│   (Render)       │      │   (Serverless)       │
│                  │      │                      │
│  Permanent data  │      │  Live queue state    │
│  Orders, menus,  │      │  RPUSH / LREM        │
│  payment records │      │  Position tracking   │
└──────────────────┘      └──────────────────────┘
         │
┌────────▼────────┐
│  Expo + FCM V1  │
│  Push pipeline  │
└─────────────────┘
```

### Stack at a glance

| Layer | Technology | Why |
|---|---|---|
| Mobile frontend | React Native + Expo (EAS) | Native Bluetooth + FCM access from JS |
| Backend | FastAPI (Python) | Async-native, fast to build REST + WebSocket endpoints |
| Containerisation | Docker | Consistent environment across team machines |
| Primary database | PostgreSQL | Durable source of truth for orders and receipts |
| Live queue | Upstash Redis (Serverless) | Sub-millisecond queue reads without disk I/O |
| Payments | Razorpay | Native payment overlay with backend signature validation |
| Push notifications | Expo + Firebase Cloud Messaging V1 | Event-driven order-ready alerts |
| Menu images | Unsplash API | Auto-fetches food images when admin hasn't uploaded one |
| OCR | Tesseract | Scans physical menus into structured database entries |

---

## Features

### Student side
- **Proximity-gated ordering** — Bluetooth verification ensures only students physically in the canteen can place orders, preventing remote ordering abuse
- **Dynamic menu** — `FoodCard` components with live availability, AI-suggested pricing, and auto-fetched images via Unsplash API
- **Razorpay payments** — Secure native payment overlay; all transactions validated server-side via signature checks before the order is confirmed
- **Live queue position** — WebSocket connection to the Redis queue shows exact position in line, updating in real time as orders ahead are fulfilled
- **Push notification on ready** — FCM V1 push wakes the student's phone the moment the kitchen marks their order as `READY`

### Admin / kitchen side
- **Kitchen dashboard** — Staff toggle order status through `RECEIVED → PREPARING → READY`; each status change broadcasts to the student's WebSocket and triggers the push pipeline
- **Tesseract OCR menu scanning** — Admin scans a physical printed menu; Tesseract extracts the text, AI formats it to structured JSON, and items are auto-populated into the database
- **AI price suggestions** — Suggested prices generated from item name and category to help admins onboard menus faster

---

## Challenges & What We Learned

### The Queue Drift Problem
The original implementation used simple integer counters in Redis to track queue position. Under concurrent load, counters could go out of sync — queue positions going negative if a kitchen worker accidentally double-clicked a status update. We refactored to **Redis Lists** using `RPUSH` and `LREM`, which made queue state atomic and drift-proof by design.

### Firebase FCM V1 Migration
Mid-build, Google deprecated the Legacy FCM API. We navigated the migration by generating Service Account JSON keys and uploading them to the Expo dashboard, transitioning the entire push pipeline to FCM V1 protocol. A painful but valuable lesson in building on top of third-party infrastructure.

### The Credential Exposure Incident
Early in development, a PostgreSQL connection URI was accidentally committed to the repo. We rotated credentials immediately, scrubbed git history, and moved everything into `.env` files with a strict `.gitignore` rule. Environment variable hygiene became a non-negotiable from that point forward.

### Local Development with React Native + Backend
Getting the React Native app to talk to a locally-running FastAPI server required tunnelling via `adb reverse tcp:8000 tcp:8000` — this created a stable bridge for the device to reach localhost, which was critical for debugging WebSocket connections and the Razorpay payment flow before cloud deployment.

---

## Team

Built by a team of 3 as part of the BE (Artificial Intelligence) curriculum at Don Bosco Institute of Technology, Mumbai.
