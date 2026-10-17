# Pip & Friends: AI-Powered English Learning Chatbot for Children Under 7

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-green.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

An interactive, child-centered English learning companion designed for young children aged 3 to 6. Built with progressive curriculum levels, social and emotional learning (SEL), a multi-signal child mode state machine, sub-2-second response latency, and strict child privacy guardrails.

---

## 🌟 Key Features

1. **Progressive Learning Across 3 Genuine Levels:**
   - **Level 1: Foundations (Ages 3–4):** Single-sentence interactions, colors, numbers 1–10, polite greetings, everyday objects. 2 choices with visual emoji aids.
   - **Level 2: Growing Skills (Ages 4–5):** 3 choices, action verbs, weather, family, food, numbers up to 20, fill-in-the-blank sentence completion.
   - **Level 3: Confident Conversations (Ages 5–6):** Reading comprehension with mini-stories, temporal sequencing, descriptive adjectives, open conversational practice.
2. **Dedicated Child Mode State Machine:**
   - Heuristic multi-signal classifier distinguishing between `LEARNING`, `CONVERSATION`, `ENGAGEMENT`, `SUPPORT`, and `IDLE`.
   - Never traps a child in a lesson; respects `"stop"` or `"exit"` commands immediately.
   - Automatically detects repeated errors and simplifies questions while offering emotional encouragement.
3. **Integrated Social and Emotional Learning (SEL):**
   - Helps children identify and express 7 core emotions (`happy`, `sad`, `angry`, `scared`, `excited`, `tired`, `confused`).
   - Normalizes mistakes (*"Learning is like riding a bike: wobbles happen before we zoom!"*).
   - Interactive guided breathing balloon exercise for emotional regulation.
4. **Child Safety & COPPA Compliance by Design:**
   - Zero collection of personally identifiable information (PII).
   - In-browser Text-to-Speech (TTS) and Speech-to-Text (STT) via Web Speech API—no audio is stored or recorded on servers.
   - Strict deflection of prompt injections and system overrides.
   - Calm, immediate referral to a trusted adult if abuse or danger is disclosed.
5. **Measurable Sub-2-Second Latency:**
   - Measured **p95 latency of 30.8 ms** (under concurrent load), well below the 2,000 ms requirement.
   - Hybrid AI architecture: deterministic learning engine paired with an optional LLM adapter (Gemini / OpenAI) backed by a 1,500ms timeout budget and deterministic fallback.
6. **Parent & Educator Dashboard:**
   - Transparent advancement rules: explains why a child is or is not ready to graduate (requires ≥80% accuracy over ≥15 questions across ≥2 sessions to prevent lucky guesses).
   - Manual level override with adult math gatekeeper.
   - One-click progress reset and permanent GDPR-K data deletion.

---

## 🏗️ Architecture Overview

For in-depth architectural details and Mermaid diagrams, see [docs/ARCHITECTURE.md](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/ARCHITECTURE.md) and [docs/SYSTEM_DESIGN.md](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/SYSTEM_DESIGN.md).

```text
[Child UI / Parent UI]
        │
        ▼
[Express API Gateway & Latency Stopwatch]
        │
        ▼
[Conversation Orchestrator & Multi-Signal Mode Classifier]
   ├── Learning Engine (Deterministic Progression & Scoring)
   ├── SEL Engine (Empathy & Breathing Guidance)
   ├── Safety Guardrail (Abuse Referral & Injection Filter)
   └── Hybrid AI Adapter (Optional LLM < 1500ms -> Deterministic Fallback)
        │
        ▼
[Curriculum Library (JSON) & Persistent Storage]
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ (tested on Node.js v24.21.0)
- npm v9+

### 1. Clone & Install
```bash
git clone https://github.com/Eagl3Eyes/AI-Powered-English-Learning-Chatbot-for-Children-Under-7-Years-Old-.git
cd AI-Powered-English-Learning-Chatbot-for-Children-Under-7-Years-Old-
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: add `GEMINI_API_KEY` or `OPENAI_API_KEY`. If omitted, the deterministic fallback runs with 100% functionality and <50ms latency.)*

### 3. Build & Run
```bash
# Build all workspaces (packages/shared, apps/api, apps/web)
npm run build

# Start both backend API (port 4000) and frontend Vite server (port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing and Benchmarks

### Run Automated Test Suite
Runs 20 unit, state machine, safety, and API tests:
```bash
npm run test
```

### Run 5-Dimension Automated Evaluation Suite
Evaluates 21 deterministic assertions across educational correctness, mode detection, context isolation, safety/SEL, and reliability fallbacks:
```bash
npm run eval
```

### Run Latency Benchmark
Measures statistical p50, p95, and p99 response times under concurrent load:
```bash
npm run benchmark
```

**Measured Latency Benchmark Output:**
- **p50 Latency:** 3.90 ms
- **p95 Latency:** 30.61 ms *(Target: < 2,000 ms)*
- **p99 Latency:** 43.73 ms
- **Error Rate:** 0.0% (60 / 60 requests successful)

---

## 🌐 Public Deployment

The application is deployed live in production on Vercel:
- **Live Production URL:** [https://pip-english-kids.vercel.app](https://pip-english-kids.vercel.app)
- **API Health Endpoint:** [https://pip-english-kids.vercel.app/api/health](https://pip-english-kids.vercel.app/api/health)
- **API Readiness Endpoint:** [https://pip-english-kids.vercel.app/api/ready](https://pip-english-kids.vercel.app/api/ready)
- **Curriculum Skills API:** [https://pip-english-kids.vercel.app/api/v1/curriculum/skills](https://pip-english-kids.vercel.app/api/v1/curriculum/skills)
- **Prerequisite Graph API:** [https://pip-english-kids.vercel.app/api/v1/curriculum/prerequisites](https://pip-english-kids.vercel.app/api/v1/curriculum/prerequisites)
- **Frontend Assets:** Built to `apps/web/dist` and globally distributed via Vercel Edge CDN.
- **Backend API:** Managed via serverless routing directing `/api/*` to the Express conversation engine.

---

## 📜 Documentation Index

- [docs/SYSTEM_DESIGN.md](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/SYSTEM_DESIGN.md) - Full 17-section system design document with EMA mastery formula and prerequisite graph.
- [docs/ARCHITECTURE.md](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/ARCHITECTURE.md) - Architecture deep dive and dataflow breakdown.
- [docs/architecture.mmd](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/architecture.mmd) - Editable Mermaid source diagram.
- [docs/TESTING.md](file:///d:/Personal%20Project/Interview%20Test/AI-Powered%20English%20Learning%20Chatbot%20for%20Children%20Under%207/docs/TESTING.md) - Comprehensive test, evaluation framework, and latency benchmark reports.
