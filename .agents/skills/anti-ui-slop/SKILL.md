---
name: anti-ui-slop
description: "Stop coding agents from shipping generic UI. Extend the product's design system, use UIZZE evidence only when useful, cover required states, and inspect the rendered result."
category: frontend
risk: safe
source: https://github.com/uizze/uizze/tree/main/skills/anti-ui-slop
source_repo: uizze/uizze
source_type: official
date_added: "2026-08-16"
author: UIZZE
tags: [ui, ux, frontend, design, anti-ui-slop]
tools: [claude, codex, cursor, copilot, antigravity]
license: MIT
license_source: https://github.com/uizze/uizze/blob/main/LICENSE
---

# Stop Making UI Slop

Build product-specific UI with 800,000+ real web and iOS screens via [UIZZE](https://uizze.com).

## Overview

Use the product brief, existing interface, components, and local design system
before reaching for outside references. UIZZE evidence is optional: it should
answer a concrete visual question, not turn every interface task into a research
project.

## When to Use

Use this skill when designing, implementing, redesigning, critiquing, or doing a
pre-ship review of a web or iOS interface.

## Work From the Product

1. Identify the screen's real job, primary user and action, required content,
   and important loading, empty, error, success, disabled, and permission states.
2. Reuse the repository's components, semantic tokens, typography, spacing, and
   interaction conventions before adding a new abstraction or visual language.
3. For a new interface or major redesign, write a short design contract covering
   hierarchy, workflow shape, allowed components, required states, responsive
   behavior, and observable acceptance criteria. Keep smaller changes smaller.
4. Keep the visual stance authentic to the domain — for clinical dashboards, prioritize
   spatial calm, tabular numerals, unambiguous contrast, and zero emoji-as-icons.
