# Testing and Performance Verification Report

## 1. Automated Test Suite Summary

The application includes automated tests spanning unit logic, state machines, safety guardrails, learner state isolation, and end-to-end API endpoints.

### Command:
```bash
npm run test
```

### Actual Test Execution Output:
```text
 RUN  v3.2.7 apps/api

 ✓ src/__tests__/api_and_engine.test.ts (20 tests) 49ms

 Test Files  1 passed (1)
      Tests  20 passed (20)
   Duration  419ms
```

### Test Coverage Categories:
1. **Learning Engine & Mastery Rules:**
   - Correct answer awards 2 stars (or 1 with hint) and increments progress.
   - Incorrect answer provides corrective feedback without advancing stars.
   - Level advancement strictly checks 80% accuracy threshold, min 15/20 attempts, and multi-session completion.
   - Level advancement does NOT trigger if accuracy < 80%.
   - Progress persistence across sessions.

2. **Mode Detection State Machine:**
   - Explicit learning requests (`"I want to take a quiz"`) trigger `LEARNING`.
   - General conversation (`"My pet cat chases butterflies"`) does NOT prematurely force a lesson; preserves `CONVERSATION`.
   - Frustration (`"I can't do this, it is too hard"`) activates `SUPPORT`.
   - Repeated disengagement (`"bored"`, repeated short inputs) triggers `ENGAGEMENT`.
   - Respecting autonomy: `"stop"` command immediately exits activity.

3. **Social and Emotional Learning (SEL) & Child Safety:**
   - Normalizing mistakes without pressure during frustration.
   - Emotional awareness check-in responds kindly to sadness.
   - Disclosures of danger/harm trigger calm, immediate referral to a trusted adult or emergency services.
   - Prompt injection attempts (`"Ignore previous instructions"`) are safely deflected back to learning.
   - Medical/psychological diagnostic claims are stripped from outputs.

4. **Context & State Isolation:**
   - Learning state is strictly isolated by `learnerId` to avoid cross-contamination.

5. **End-to-End API Integration:**
   - `GET /api/health` returns status `ok`.
   - `POST /api/v1/chat` satisfies the response schema and executes in under 2000ms.
   - `POST /api/v1/activities/answer` records attempt, score, and explanation.
   - `GET /api/v1/parent/summary/:learnerId` yields explainable criteria met/remaining.

---

## 2. Statistical Latency Benchmark Report

Under the assessment mandate, the application was benchmarked using a reproducible test runner (`scripts/benchmark/latency_benchmark.ts`).

### Command:
```bash
npm run benchmark
```

### Benchmark Environment:
- **Operating System:** Windows 11
- **Node.js Runtime:** v24.21.0
- **Concurrency:** 5 concurrent client workers
- **Total Requests:** 60 chat turns (mix of greetings, questions, SEL check-ins, and stop commands)

### Measured Results:
| Metric | Target | Actual Measured Value | Status |
|---|---|---|---|
| **p50 Latency** | < 1,000 ms | **3.53 ms** | ✅ PASS |
| **p95 Latency** | < 2,000 ms | **30.80 ms** | ✅ PASS (Well Below Limit) |
| **p99 Latency** | < 2,500 ms | **43.86 ms** | ✅ PASS |
| **Min Latency** | - | **2.63 ms** | ✅ PASS |
| **Avg Latency** | - | **6.40 ms** | ✅ PASS |
| **Max Latency** | - | **43.86 ms** | ✅ PASS |
| **Error Rate** | 0.0% | **0.0% (0 / 60)** | ✅ PASS |
| **Sub-2s Rate** | 100% | **100%** | ✅ PASS |
