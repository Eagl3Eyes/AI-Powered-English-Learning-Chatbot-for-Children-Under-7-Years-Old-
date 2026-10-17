# 🎬 120-Second Video Presentation Script

**Project:** Pip – AI-Powered Adaptive English Learning Platform for Children Under 7  
**Live URL:** [https://pip-english-kids.vercel.app](https://pip-english-kids.vercel.app)  
**Target Duration:** Exactly 120 seconds (2:00 max)  
**Tone:** Professional, engaging, concise, and technically authoritative  
**Speaker Rate:** ~140 words per minute (~280 spoken words)

---

## ⏱️ Video Timeline & Scene-by-Scene Checklist

```
00:00 - 00:15 | Scene 1: Problem & Product Vision
00:15 - 00:35 | Scene 2: System Architecture & Tech Stack
00:35 - 00:65 | Scene 3: Live Adaptive Learning & Prerequisite Engine
00:65 - 00:85 | Scene 4: Multi-Signal Child Mode Switching & SEL Engine
00:85 - 01:05 | Scene 5: Latency SLAs & COPPA/GDPR-K Child Safety
01:05 - 02:00 | Scene 6: Architectural Trade-Offs & Conclusion
```

---

## 🎙️ Spoken Script & Screen Actions

### Scene 1: Problem & Product Vision (0:00 – 0:15)
- **On Screen:** Clean browser showing Pip welcome screen on `https://pip-english-kids.vercel.app` with Pip the friendly owl avatar.
- **Spoken Audio:**
  > "Children under seven cannot be taught with generic LLM chat wrappers. Early learners need structured mastery, emotional reassurance, large visual tap targets, and safe, low-latency interaction. Meet Pip—a production-grade, adaptive English learning platform built specifically for early childhood education."

---

### Scene 2: Architecture & Technology (0:15 – 0:35)
- **On Screen:** Quick transition to `docs/architecture.mmd` diagram, highlighting the decoupled frontend, API Gateway, Orchestrator, and deterministic fallback.
- **Spoken Audio:**
  > "Architecturally, we separate conversational flexibility from educational authority. The system runs on React, Vite, and Tailwind on the frontend, with a Node/Express API Gateway, and a shared TypeScript domain contract. Educational evaluation and mastery tracking are strictly deterministic, ensuring zero hallucinated curriculum updates."

---

### Scene 3: Live Adaptive Learning & Prerequisite Engine (0:35 – 1:05)
- **On Screen:** Screen recording entering Level 1, answering "What color is the sun? -> Yellow", earning 2 stars, then taking a hint on the next question. Then opening the Parent Dashboard showing the Exponential Moving Average mastery breakdown.
- **Spoken Audio:**
  > "Watch our adaptive curriculum in action. Across Levels 1 through 3, our expanded library of over 120 vocabulary items, 60 quizzes, and interactive stories are indexed by a prerequisite dependency graph. Mastery updates use an Exponential Moving Average—alpha point-three-five—penalizing hints transparently while preserving child confidence."

---

### Scene 4: Mode Switching & SEL Engine (1:05 – 1:25)
- **On Screen:** In chat, child types "I feel sad because my tower fell down". Pip immediately enters SUPPORT mode with gentle empathy and no lesson pressure. Then child says "Stop quiz", and Pip switches to conversational rest.
- **Spoken Audio:**
  > "Not every child message is a lesson request. Our multi-signal mode classifier switches between Learning, Conversation, Support, Engagement, and Idle. When a child expresses sadness or frustration, Pip suspends the quiz and offers social-emotional support without diagnostic labels."

---

### Scene 5: Performance & Safety (1:25 – 1:45)
- **On Screen:** Terminal showing `npm run benchmark` (p95 at ~30.6ms) and `npm run eval` passing 21 of 21 assertions across all 5 dimensions. Show injection attempt deflection in chat.
- **Spoken Audio:**
  > "Safety and latency are architectural guarantees. Prompt injections are deflected, PII is automatically redacted, and distress disclosures trigger immediate trusted-adult referrals. Under benchmark load, Pip delivers a p95 latency of thirty-one milliseconds—well below our two-second SLA."

---

### Scene 6: Trade-offs & Conclusion (1:45 – 2:00)
- **On Screen:** Parent Dashboard showing GDPR-K data deletion button, followed by GitHub repo summary.
- **Spoken Audio:**
  > "We deliberately chose client-side Web Speech and bounded in-memory caching to guarantee zero voice data retention and sub-50-millisecond response times. The platform is live, tested, and fully documented. Thank you for watching."

---

## 📋 Recording Checklist
- [ ] Browser resolution set to 1920x1080 (16:9).
- [ ] Microphone audio normalized (no echo, background noise filter enabled).
- [ ] Parent dashboard metrics cleared and re-verified.
- [ ] Latency benchmark terminal visible and legible.
- [ ] Total recorded video length verified under 120 seconds.
