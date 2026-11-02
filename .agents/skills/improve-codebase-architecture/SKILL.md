---
name: improve-codebase-architecture
description: "Explore a codebase to find opportunities for architectural improvement, focusing on turning shallow modules into deep modules with clean interfaces and seams. Use when the user asks to improve architecture, reduce spaghetti code, deepen modules, find refactoring candidates, or audit structural coupling."
---

# Improve Codebase Architecture

Audit a codebase for architectural friction and propose high-leverage refactors that turn **shallow modules** into **deep modules** (inspired by John Ousterhout's *A Philosophy of Software Design*).

## Core Vocabulary & Mental Models

Use these exact concepts when analyzing and proposing architectural improvements:

1. **Deep vs. Shallow Modules**:
   - **Deep Module**: A small, simple, stable interface that hides a large, complex implementation (e.g., Unix file I/O, a unified session store, or a single API gateway seam).
   - **Shallow Module**: An interface nearly as complex as its implementation, or pass-through wrappers that expose internal details (cookie names, headers, wire formats) to callers.
2. **Information Hiding & Leakage**:
   - **Information Leakage** occurs when a design decision (such as a cookie prefix, header format, or database column convention) is reflected across multiple modules. If changing one protocol detail requires Shotgun Surgery across 5+ files, information is leaking.
3. **The Deletion Test**:
   - Ask of any module or abstraction: *"If I deleted this module, would complexity vanish, or would the exact same complexity reappear duplicated across N callers?"*
   - If deleting it removes complexity, it is a **shallow pass-through** that should be inlined.
   - If the complexity is currently duplicated across callers, a **deep module** wants to be born.
4. **Seams & Adapters**:
   - A **Seam** is a clean boundary where a subsystem (auth, payments, external API, email) can be swapped, tested, or mocked without callers knowing how it works under the hood.
5. **Locality & Leverage**:
   - Maximize **locality** (a single logical change happens in one place) and **leverage** (one small interface solves a whole class of problems).

## Process

### 1. Explore & Scan the Codebase

Explore the codebase organically (using sub-agents or targeted searches) looking for:
- **Shotgun Surgery / Information Leakage**: The same constants, cookie names, headers, or error-parsing loops repeated across multiple files.
- **Pass-Through Layers**: Functions or modules that merely forward arguments without hiding complexity.
- **Asymmetric Domain Boundaries**: Modules that centralize reads (`GET`) while leaving writes (`POST`/`PATCH`/`DELETE`) scattered or unimplemented in UI components.
- **Tight Coupling & Missing Seams**: UI components or actions directly manipulating low-level transport details instead of calling a domain seam.

### 2. Rank & Present Candidates

Group findings into structured architectural candidates, ranked by impact:
- **Strong**: High-leverage refactors that eliminate widespread duplication or fragile coupling immediately.
- **Worth exploring**: Meaningful structural improvements with moderate trade-offs.
- **Speculative**: Optional cleanups that may only pay off as the system grows.

For each candidate, specify:
- **Affected Files**: Clickable links to every file involved.
- **The Problem**: What information is leaking or why the current boundary is shallow.
- **Proposed Deep Module / Seam**: The exact minimal interface that hides the underlying complexity.
- **Before / After Architecture Diagram**: Mermaid diagram showing how coupling decreases.

### 3. Refine & Execute

Once the user selects or approves the candidates:
1. Build the **deep module / seam** first and verify its types.
2. Migrate callers incrementally so each step keeps the build and tests green.
3. Run typecheck (`tsc --noEmit`), linter (`eslint`), and E2E/unit tests to confirm zero regressions.

