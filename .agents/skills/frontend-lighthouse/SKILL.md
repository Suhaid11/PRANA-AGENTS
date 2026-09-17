---
name: frontend-lighthouse
description: "Add a portable Lighthouse CI gate for production frontend builds with Core Web Vitals budgets, category floors, median runs, and CI artifacts."
category: frontend
risk: safe
source: community
source_repo: stareezy-1/frontend-architecture-skill
source_type: community
date_added: "2026-06-29"
author: stareezy-1
tags: [frontend, lighthouse, performance, core-web-vitals, ci]
tools: [lighthouse, node, github-actions, antigravity]
license: "MIT"
license_source: "https://github.com/stareezy-1/frontend-architecture-skill/blob/main/LICENSE"
---

# Frontend Lighthouse (portable performance gate)

Portable skill for Lighthouse performance & accessibility gates.
Budgets live in `lighthouserc.cjs`, runs test against optimized production build (`dist/`).

## The Core Ideas

1. **One config, one source of truth.** All budgets and assertions live in a single `lighthouserc.cjs`.
2. **Gate the production build, never dev.** Lighthouse runs against `vite build` + `vite preview` (the real, optimized output).
3. **Core Web Vitals targets**:
   - LCP ≤ 2500 ms
   - CLS ≤ 0.1
   - TBT ≤ 200 ms
   - Accessibility category score ≥ 90
