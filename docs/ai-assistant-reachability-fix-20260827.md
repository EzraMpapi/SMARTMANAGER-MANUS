# AI Assistant reachability fix

**Date:** 27 August 2026
**Author:** Manus AI

## Diagnosis

The reported message was produced by the primary dashboard `ChatInterface` in `client/src/BusinessSphereDashboardCore.jsx`. Its `send()` catch block discarded every underlying tRPC error and replaced it with the same generic text, so authentication failures, rate limits, provider configuration failures, invalid requests, and transport failures were indistinguishable to the user. The server already returned more useful safe messages for several of these conditions through `ai.assist`.

A second compatibility issue was found in `server/_core/llm.ts`. The Smart Assistant selects `gpt-5-mini` and supplied `maxTokens`, which the helper serialized as `max_tokens`. GPT-5-family requests require `max_completion_tokens` on the built-in LLM proxy. The helper now selects the GPT-5-compatible field automatically and retains `max_tokens` for non-GPT models.

## Implemented correction

The dashboard now classifies only safe, known server responses: expired or missing authorization prompts a sign-in message; rate limiting reports provider load; invalid requests advise shortening or rephrasing; administrator/provider availability messages remain actionable; and unknown errors use a stable generic fallback without exposing raw provider payloads. The existing retry action is preserved and retries the user’s question.

The LLM helper now accepts both camelCase and snake_case completion-limit options. For model IDs matching the GPT-5 family it emits `max_completion_tokens`; for other models it emits `max_tokens`. No provider key, raw response, prompt context, or secret is logged or sent to the browser.

## Validation

The focused AI suite passed **11 tests across 3 files**, covering Smart Assistant structured responses, safe error-message source contracts, and GPT-5/non-GPT request payload compatibility. The full repository suite then passed **1,112 tests across 271 files**, with **15 intentionally skipped tests across 7 files**, in **26.28 seconds**. TypeScript checking passed, and the direct Vite production build passed after transforming 2,693 modules.

The final dashboard assets were: route wrapper **1,661 bytes**, dashboard core **3,995,200 bytes**, community modules **438,013 bytes**, additional modules **93,497 bytes**, and static data **56,257 bytes**. The core remains immediately loaded by the wrapper, so the practical initial dashboard payload is still above 500 kB.

## Deployment boundary

The correction was pushed to branch `manus/ecommerce-followup-validation-20260827` through pull request [#58](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/pull/58), because `main` is protected and requires pull-request checks. The `menejajanja` Vercel deployment check completed successfully; unrelated Vercel project contexts reported deployment rate limiting. No live provider call was made by this validation, and no Supabase schema or business data was mutated.
