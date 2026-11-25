# Complete Guide to Matt Pocock's Agent Skills (`mattpocock/skills`)

A comprehensive reference covering every skill discussed, how they connect, dependency requirements, real-world examples, installation commands, and the end-to-end workflow from idea to merged Pull Request.

---

## Table of Contents

1. [End-to-End Workflow & Context Management](#1-end-to-end-workflow--context-management)
2. [CLI Installation Cheat Sheet](#2-cli-installation-cheat-sheet)
3. [Interview & Planning Skills (`grilling`, `grill-me`, `grill-with-docs`)](#3-interview--planning-skills-grilling-grill-me-grill-with-docs)
4. [Setup & Specification Skills (`setup-matt-pocock-skills`, `to-spec`, `to-tickets` / `to-issues`)](#4-setup--specification-skills-setup-matt-pocock-skills-to-spec-to-tickets--to-issues)
5. [Execution, Navigation & TDD (`ask-matt`, `tdd`, `implement`, `implement-spec`)](#5-execution-navigation--tdd-ask-matt-tdd-implement-implement-spec)
6. [Background Rulebooks (`domain-modeling`, `codebase-design`)](#6-background-rulebooks-domain-modeling-codebase-design)
7. [Shaping, Debugging & Triage (`prototype`, `diagnosing-bugs`, `triage`)](#7-shaping-debugging--triage-prototype-diagnosing-bugs-triage)
8. [Review, Shipping & Retrospectives (`code-review`, `pr`, `retro`)](#8-review-shipping--retrospectives-code-review-pr-retro)
9. [Productivity, Communication & Learning (`teach`, `to-questionnaire`, `wait-what`, `writing-fragments`)](#9-productivity-communication--learning-teach-to-questionnaire-wait-what-writing-fragments)
10. [Experimental & Deprecated Skills (`claude-handoff`, `loop-me`, `resolving-merge-conflicts`)](#10-experimental--deprecated-skills-claude-handoff-loop-me-resolving-merge-conflicts)
11. [Global vs. Local Installation (Stateful Skills)](#11-global-vs-local-installation-stateful-skills)

---

## 1. End-to-End Workflow & Context Management

Matt Pocock's engineering workflow works like a relay race where each skill hands off cleanly to the next—while aggressively clearing your chat window (`/clear`) between heavy phases so the AI never suffers from context rot.

```text
[1. One-Time Repo Setup]
   /setup-matt-pocock-skills  ──▶ Writes tracker & doc rules to AGENTS.md / CLAUDE.md
           │
           ▼  (/clear chat)
[2. Discovery & Planning]
   (/prototype)               ──▶ Optional: throwaway UI or state-machine sandbox
   /grill-with-docs           ──▶ Interviews you; updates GLOSSARY.md & docs/adr/
           │
           ▼  (keep SAME chat)
[3. Packaging the Plan]
   /to-spec                   ──▶ Publishes 1 master Spec issue in your tracker
   /to-tickets                ──▶ Splits Spec into small vertical-slice sub-issues
           │
           ▼  (/clear chat)
[4. Execution]
   ┌──────────────────────────┴──────────────────────────┐
   ▼ (Ticket-by-ticket)                                  ▼ (All at once AFK)
   /implement #11  ──▶ (/clear) ──▶ /implement #12       /implement-spec #10
     └─ drives /tdd + codebase-design + /code-review       └─ parallel worktrees + PR
           │
           ▼  (/clear chat)
[5. Shipping & Improvement]
   /code-review main          ──▶ Optional final check against standards + spec
   /pr                        ──▶ Opens PR with before/after verification proof
   /retro                     ──▶ Audits session friction & improves AGENTS.md
```

### When to `/clear` Your Context Window
* **Keep the same session:** `/grill-with-docs` → `/to-spec` → `/to-tickets` (these rely directly on the decisions you just discussed).
* **Always `/clear` before:** Starting `/implement #<id>`, starting `/implement-spec #<id>`, switching to a new bug in `/diagnosing-bugs`, or running `/code-review` on a large branch.
* **Unsure what to run next?** Type `/ask-matt` at any point—it recommends the exact command and whether to `/clear`, then stops immediately.

---

## 2. CLI Installation Cheat Sheet

### Install All Skills Globally (Recommended)
Installing globally (`-g`) places the instructions in `~/.claude/skills/` or `~/.agents/skills/` so every slash command is available across all repositories without mixing project files:

```bash
npx skills add mattpocock/skills -g
```

### Install Only the Core Engineering Chain (Minimal Setup)
If you want to skip experimental/productivity extras and install only the core planning-to-PR pipeline plus hidden dependencies:

```bash
npx skills add mattpocock/skills -g   --skill setup-matt-pocock-skills   --skill grilling   --skill domain-modeling   --skill grill-me   --skill grill-with-docs   --skill to-spec   --skill to-tickets   --skill codebase-design   --skill tdd   --skill code-review   --skill implement   --skill implement-spec   --skill writing-for-humans   --skill pr   --skill diagnosing-bugs   --skill ask-matt
```

### Minimal Dependency Matrix
Because wrapper skills call core rulebooks under the hood, never install a wrapper without its required dependencies:

| Command You Want | Minimum Skills Required |
| :--- | :--- |
| `/grill-me` | `grilling` + `grill-me` |
| `/grill-with-docs` | `grilling` + `domain-modeling` + `grill-with-docs` |
| `/tdd` | `codebase-design` + `tdd` |
| `/code-review` | `codebase-design` + `code-review` |
| `/implement` | `codebase-design` + `tdd` + `code-review` + `implement` |
| `/triage` | `grilling` + `domain-modeling` + `writing-for-agents` + `triage` |
| `/pr` | `writing-for-humans` + `pr` |

---

## 3. Interview & Planning Skills (`grilling`, `grill-me`, `grill-with-docs`)

Instead of you prompting the AI, these skills reverse the roles: the AI interviews *you* in structured rounds, maps your idea as a decision tree, asks all unblocked questions at once (with recommended defaults), and refuses to write code until every branch is settled.

### `grilling` (The Core Interview Engine)
* **Role:** The internal, reusable instruction set defining *how* the interview works.
* **How it's used:** Rarely invoked manually. Loaded automatically by `grill-me`, `grill-with-docs`, `wayfinder`, `triage`, and `loop-me`.
* **Can you skip installing `grilling`?** **No.** `grill-me` and `grill-with-docs` are ~15-line wrappers that delegate to `grilling`. Without it, they lose their decision-tree and batch-questioning behavior. *(Workaround: paste the contents of `grilling/SKILL.md`—and `domain-modeling/SKILL.md` for `grill-with-docs`—directly into the wrapper files if you strictly want fewer folders).*

### `/grill-me` (Stateless & Portable)
* **Role:** Lightweight user-invoked wrapper around `grilling`.
* **State & Files:** **Stateless.** Reads no codebase and writes zero files to disk; everything stays in the chat.
* **Example:** You have no code repository yet and want to design a newsletter monetization model. You run `/grill-me`, answer 3 rounds of targeted questions, and leave with a sharp plan and zero leftover files.

### `/grill-with-docs` (Stateful & Codebase-Aware)
* **Role:** Combines `grilling` (the interview) with `domain-modeling` (reading/writing repo docs).
* **State & Files:** **Stateful.** Inspects your codebase before asking questions so it never asks things the code already answers. As decisions settle, it writes:
  1. **`GLOSSARY.md` (formerly `CONTEXT.md`):** Updated live whenever you agree on a project-specific term.
  2. **`docs/adr/` (Architecture Decision Records):** Created only when a decision is hard to reverse, surprising without context, and involves a real trade-off.
* **Example:** You want to add "Team Billing" to an existing SaaS repo. You run `/grill-with-docs`. It checks your Stripe code first, saves your agreed definition of a `"Workspace Seat"` into `GLOSSARY.md`, and logs why you chose soft-deletes for canceled teams in `docs/adr/001-soft-delete-teams.md`.

### Comparison Table

| Feature | `grilling` | `/grill-me` | `/grill-with-docs` |
| :--- | :--- | :--- | :--- |
| **What it is** | Core interview engine | User command (`/grill-me`) | User command (`/grill-with-docs`) |
| **Triggered by** | Other skills automatically | You (manually) | You (manually) |
| **Reads your code?** | No | No | Yes |
| **Writes files?** | No | No (chat only) | Yes (`GLOSSARY.md` & `docs/adr/`) |
| **Best use case** | Custom agent workflows | Loose ideas, non-code, quick chats | Real features inside an existing repo |

---

## 4. Setup & Specification Skills (`setup-matt-pocock-skills`, `to-spec`, `to-tickets` / `to-issues`)

### `/setup-matt-pocock-skills` (One-Time Repo Configurator)
* **What it does:** Run **once per repository** to connect Matt's skills to your workflow. It asks 3 questions with defaults and writes rules into `AGENTS.md` (or `CLAUDE.md`) plus `docs/agents/`:
  1. **Issue Tracker:** GitHub Issues (`gh`), GitLab (`glab`), Linear/Jira, or local `.scratch/` Markdown files.
  2. **Triage Labels:** Maps standard statuses (`ready-for-agent`, `needs-info`, `wontfix`) to your repo's labels.
  3. **Domain Docs Paths:** Confirms where `GLOSSARY.md` and `docs/adr/` live.
* **Example:** You clone a repo, run `/setup-matt-pocock-skills`, confirm GitHub Issues as your tracker, and the rules are permanently saved in `AGENTS.md`.

### `/to-spec` (Formerly `/to-prd` — The Blueprint)
* **What it does:** Packages everything decided during `/grill-with-docs` into **one master specification issue** in your tracker so a fresh session can build it without losing context.
* **Key rules:** Asks zero new design questions; records an explicit **Out of Scope** section; confirms high-level **Testing Seams** (aiming for 1 clean seam) before publishing. *(Skip `/to-spec` if the task is tiny enough to finish in the same chat).*

### `/to-tickets` (Formerly `/to-issues` — The Work Orders)
* **Naming note:** `/to-issues` was renamed to **`/to-tickets`** in newer versions of the repo—they are the exact same skill.
* **What it does:** Splits your `/to-spec` issue into **multiple small sub-issues** structured as **tracer-bullet vertical slices** (cutting across UI + API + DB together rather than horizontal layers), with explicit dependency/blocker links so each ticket fits comfortably inside one `/implement` session.

### Comparison & Example

| Feature | `/to-spec` *(formerly `/to-prd`)* | `/to-tickets` *(formerly `/to-issues`)* |
| :--- | :--- | :--- |
| **Output** | **1** master specification issue | **Multiple** small task issues |
| **Focus** | Requirements, edge cases & out-of-scope rules | Implementation order, vertical slices & blockers |
| **When to run** | Right after `/grill-with-docs` finishes | Right after `/to-spec` (in the **same** chat) |

* **Example:** After grilling a "Two-Factor Authentication" feature, `/to-spec` creates **Issue #10: `[Spec] 2FA`**. Running `/to-tickets` next splits it into **Issue #11** (TOTP secret + setup UI), **Issue #12** (verify 6-digit code on login, blocked by #11), and **Issue #13** (8 backup codes, blocked by #12).

---

## 5. Execution, Navigation & TDD (`ask-matt`, `tdd`, `implement`, `implement-spec`)

### `/ask-matt` (The Workflow GPS)
* **What it does:** Tells you which skill (or sequence of skills) to run next and whether to `/clear` or `/compact` your context window—then **immediately stops** without editing files.
* **Example:** You type `/ask-matt I have 15 vague bug reports in GitHub` → It tells you to run `/triage`, then `/clear` and run `/implement` on each ready ticket.

### `/tdd` (The Coding Discipline)
* **What it does:** Enforces strict **Red → Green → Refactor** vertical slicing. It forbids writing all tests upfront ("horizontal slicing"); instead, the AI writes **one** failing behavioral test, writes the minimum code to pass, refactors, and repeats. Loads `codebase-design` automatically.
* **Example:** `/tdd Create a rate-limiter helper that blocks requests after 5 attempts per minute` writes 1 failing test for the 6th attempt, implements it, refactors, and iterates edge cases.

### `/implement` (Single-Ticket Builder — Replaced `/do-work`)
* **What it does:** Executes one pre-decided ticket or spec on your current Git branch without redesigning it: maps testing seams → drives `/tdd` → runs typechecks & full test suite → runs `/code-review` → commits.
* **Example:** In a clean chat, `/implement #11` builds Issue #11 test-first, verifies all checks pass, self-reviews the diff, and creates a Git commit.

### `/implement-spec` (Parallel AFK Spec Builder)
* **What it does:** Takes an entire `/to-spec` + `/to-tickets` plan and spawns parallel subagents in isolated Git worktrees to build **all** tickets simultaneously, merges them, runs `/code-review`, and opens a Pull Request.
* **Example:** `/implement-spec #10` builds all sub-tickets for your 2FA spec in parallel while you step away, opening a finished PR when done.

---

## 6. Background Rulebooks (`domain-modeling`, `codebase-design`)

* **`domain-modeling`:** Loaded automatically by `grill-with-docs`, `wayfinder`, `triage`, and `improve-codebase-architecture`. Keeps project vocabulary consistent in `GLOSSARY.md` and records high-stakes architectural trade-offs in `docs/adr/`.
* **`codebase-design`:** Loaded automatically by `tdd`, `implement`, `code-review`, and `improve-codebase-architecture`. Enforces John Ousterhout's *A Philosophy of Software Design* ("deep modules" with simple interfaces and clean seams instead of fragmented wrapper functions).

---

## 7. Shaping, Debugging & Triage (`prototype`, `diagnosing-bugs`, `triage`)

### `/prototype` (Throwaway Experimenter)
* **What it does:** Builds fast, disposable demos to test tricky assumptions before writing production code, then deletes the prototype once you decide:
  * **Logic mode:** Single shareable interactive HTML simulator with free-play buttons and guided walkthroughs for complex state machines.
  * **UI mode:** Injects radically different UI layouts onto a route with a floating switcher bar so you can compare them live.
* **Example:** Run `/prototype` to test how stacked discount codes behave in a checkout state machine via an interactive HTML page before locking rules in `/grill-with-docs`.

### `/diagnosing-bugs` (Scientific 6-Phase Bug Hunter)
* **What it does:** Stops the AI from guessing at broken code using a gated scientific method:
  1. **Tight Feedback Loop (Hard Gate):** Must run a single named command/test that reliably fails before forming any theory.
  2. **Minimize Repro:** Strips away unrelated setup.
  3. **Rank Hypotheses:** Lists 3–5 falsifiable theories with predictions for you to approve.
  4. **Instrument:** Adds targeted probes tagged with a unique ID (e.g., `[DEBUG-a4f2]`).
  5. **Fix with Regression Test:** Writes a failing test at the proper seam, fixes the bug, and verifies.
  6. **Cleanup:** Greps for `[DEBUG-a4f2]` to delete all temporary logs and commits with the proven root cause.

### `/triage` (Issue Inbox Sorter)
* **What it does:** Cleans up raw bug reports or feature requests—interviewing you (`grilling`), rewriting issues using `GLOSSARY.md` terms (`domain-modeling`), and applying status labels (`ready-for-agent`, `needs-info`).

---

## 8. Review, Shipping & Retrospectives (`code-review`, `pr`, `retro`)

### `/code-review` (Dual-Axis Diff Auditor)
* **What it does:** Audits branch changes in parallel subagents along two axes:
  1. **Standards:** Adheres to repo conventions and `codebase-design` module depth.
  2. **Spec:** Matches the original issue/spec without missing requirements or inventing unrequested features.
* **Example:** `/code-review main` reports both code quality and any drift from the original issue requirements.

### `/pr` (Proof-Backed Pull Request Writer)
* **What it does:** Generates a crisp Pull Request summary requiring concrete **before-and-after proof** (test output, CLI logs, or screenshots) so reviewers can trust AI-authored changes immediately.

### `/retro` (Session Post-Mortem)
* **What it does:** Reviews recent coding agent sessions to spot wasted tokens, confusion, or missing guardrails—and suggests improvements to your repo's `AGENTS.md`, `GLOSSARY.md`, linters, or `code-review` rules. *(Always review its suggestions with human judgment rather than running on autopilot).*

---

## 9. Productivity, Communication & Learning (`teach`, `to-questionnaire`, `wait-what`, `writing-fragments`)

* **`/teach` (Multi-Session Interactive Tutor):** Turns your current directory into a persistent learning workspace (`MISSION.md`, `RESOURCES.md`, `NOTES.md`, `learning-records/`) and generates self-contained interactive HTML lessons (`./lessons/0001-*.html`) using spaced repetition and retrieval quizzes.
* **`/to-questionnaire` (Async Team Survey Maker):** Converts open decisions that *you* can't answer into a clean Markdown questionnaire (`to-questionnaire-<slug>.md`) to send to a teammate, designer, or client.
* **`/wait-what` (Plain-English Decoder):** Forces the AI to pause when an explanation is too dense or full of jargon and translate it into simple, everyday English using your `GLOSSARY.md` terms.
* **`writing-fragments` (Rough-Notes Polisher):** Organizes messy bullet dumps or voice-dictation notes into structured, coherent prose without losing your original points.

---

## 10. Experimental & Deprecated Skills (`claude-handoff`, `loop-me`, `resolving-merge-conflicts`)

| Skill | Status | What It Does |
| :--- | :--- | :--- |
| **`/claude-handoff`** | Beta (`in-progress`) | Spawns a fresh background Claude agent and hands over your current context automatically (unlike `/handoff`, which writes a Markdown file for manual copy-paste). |
| **`/loop-me`** | Beta (`in-progress`) | Specialized `/grill-me` variant that interviews you to design recurring automated agent workflows ("loops"). |
| **`/resolving-merge-conflicts`** | **Deleted (v1.3.0)** | Removed with no replacement; modern models resolve standard Git conflicts natively. |

---

## 11. Global vs. Local Installation (Stateful Skills)

**Install all skills globally (`-g`).** There is zero risk of cross-project contamination:

1. **Global folders only store instructions:** `npx skills add mattpocock/skills -g` only saves the static `SKILL.md` rulebooks in `~/.claude/skills/` or `~/.agents/skills/`.
2. **Project data is always written to your current working directory:**
   * `domain-modeling` reads and writes `./GLOSSARY.md` and `./docs/adr/` inside **whichever repository** you are currently working in.
   * `teach` creates `./MISSION.md`, `./lessons/`, and `./learning-records/` inside **whichever learning folder** you open (e.g., `~/learning/rust/`).
3. **Result:** Every slash command works immediately in every folder on your machine while keeping every project's glossary, ADRs, and lessons completely isolated.
