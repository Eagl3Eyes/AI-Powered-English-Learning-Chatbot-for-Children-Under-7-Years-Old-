# System Architecture: AI-Powered English Learning Chatbot

## 1. Architectural Overview

The application follows a **hybrid, low-latency, child-centered architecture** combining deterministic educational rule engines with optional Large Language Model (LLM) augmentation. This guarantees sub-2-second response latency, 100% availability, and strict safety guardrails for young children under seven.

```mermaid
graph TD
  subgraph Client["Client Application (Web & Mobile Browsers)"]
    ChildUI["Child Interface (Large buttons, emojis, speech TTS/STT)"]
    ParentUI["Parent / Educator Dashboard (Progress & Rule Overrides)"]
  end

  subgraph Gateway["API Layer & Edge Gateway"]
    CORS["CORS & Request Limiter"]
    SessionHandler["Session & Identity Validation"]
    LatencyTracker["Latency Stopwatch (Target < 2000ms)"]
  end

  subgraph Orchestration["Conversation Orchestrator"]
    InputSafety["Input Safety & PII Sanitizer"]
    ModeClassifier["Child Mode Classifier (State Machine)"]
    ContextBuilder["Context & History Window (Last 6 turns)"]
  end

  subgraph Engines["Core Educational & AI Engines"]
    LearningEngine["Deterministic Learning & Level Progression Engine"]
    SelEngine["Social-Emotional Learning (SEL) & Empathy Engine"]
    SafetyPolicy["Child Safety & Abuse Referral Guardrail"]
    LLMProvider["Optional LLM Provider Adapter (Gemini / OpenAI)"]
    FallbackGen["Deterministic Child Conversation Fallback Generator"]
  end

  subgraph Persistence["Storage & Content Library"]
    ContentLib[("Educational Content Library (JSON: 50+ vocab, 30+ quiz, stories)")]
    DB[("Persistent Database (Learners, Progress, Sessions, Attempts)")]
  end

  ChildUI --> Gateway
  ParentUI --> Gateway
  Gateway --> CORS --> SessionHandler --> LatencyTracker
  LatencyTracker --> InputSafety
  InputSafety --> ModeClassifier
  ModeClassifier --> ContextBuilder

  ContextBuilder --> LearningEngine
  ContextBuilder --> SelEngine
  ContextBuilder --> SafetyPolicy
  ContextBuilder -. Optional (1500ms timeout) .-> LLMProvider

  LLMProvider -. On Timeout or Error .-> FallbackGen
  LearningEngine --> DB
  LearningEngine --> ContentLib
  SelEngine --> ContentLib
  FallbackGen --> ContentLib

  LearningEngine --> LatencyTracker
  SelEngine --> LatencyTracker
  FallbackGen --> LatencyTracker
  LLMProvider --> LatencyTracker

  LatencyTracker --> Gateway --> ChildUI
```

## 2. Key Architectural Decisions

1. **Hybrid LLM + Deterministic Core**:
   - High-stakes educational progression, quiz scoring, hint delivery, and safety enforcement are completely deterministic.
   - LLM is used only for natural conversational expansion when keys are provided and completes within a strict 1,500ms deadline.
   - If the LLM provider fails, times out, or is omitted, the deterministic fallback delivers high-quality child responses with 0ms downtime and ~10-25ms latency.

2. **Multi-Signal Child Mode Classifier**:
   - Distinguishes between `LEARNING`, `CONVERSATION`, `ENGAGEMENT`, `SUPPORT`, and `IDLE`.
   - Never traps a child in an unwanted lesson; respects explicit "stop" and "exit" commands.
   - Identifies repeated failure and lowers question difficulty while injecting emotional support.

3. **COPPA / Child Safety by Design**:
   - Zero real-world identity collected (no full names, phone numbers, emails, or geolocations).
   - Audio is synthesized and recognized purely in-browser using Web Speech APIs; zero voice audio recordings are captured or stored on servers.
   - Immediate trusted-adult referral if abuse or danger is detected.
