# KNOWLEDGE INDEX

**Purpose:** Map key concepts/features to their implementation locations (files/functions/modules)

---

## AI Agent Guidelines Index

**Purpose:** Behavioral protocols, standards, and rules for AI agents working on this project.

**Location:** `AI_MEMORY/ai_agent_guidelines/`

**When to read:**
- **MANDATORY:** Read `workflow/AGENT_DISCIPLINE.md` FIRST before ANY work.
- Read category guidelines as needed when working on relevant aspects of the codebase.

**Structured Categories & Available Guidelines:**
1. **`architecture/`** (Project structure, API design, architectural layers)
   - [PROJECT_STRUCTURE.md](ai_agent_guidelines/architecture/PROJECT_STRUCTURE.md) — Folder layout rules
2. **`development/`** (Code style, lint rules, framework conventions)
   - [core_rules.md](core_rules.md) (Note: global rules index is in the memory root, details go here)
3. **`quality_assurance/`** (Testing checklists, manual/auto test protocols)
4. **`workflow/`** (Git commit flow, agent self-discipline, session rules)
   - [AGENT_DISCIPLINE.md](ai_agent_guidelines/workflow/AGENT_DISCIPLINE.md) ⚠️ MANDATORY FIRST READ
   - [LOADER.md](LOADER.md) (Session start, located in root)
   - [EOS.md](EOS.md) (Session close, located in root)

---

## Specifications Index

**Purpose:** Detailed feature documentation

**Location:** `AI_MEMORY/specifications/`

**When to read:**
- Implementing or modifying a specific feature
- Researching how something works

**DO NOT read during LOADER** - Only read when working on that specific feature

**File Size Protocol:**
- Core files MUST stay under 500 lines
- When core file reaches 400 lines → Extract to specification
- See: `core_rules.md` - File Size Control Protocol

---

## Core Concepts → Code Locations

[Здесь маппинг концептов к файлам проекта]

---

## Components → Files Mapping

[Здесь маппинг компонентов к файлам]

---

## Services → Files Mapping

[Здесь маппинг сервисов к файлам]

---

## Testing

**Test Plan Location:** `AI_MEMORY/TESTING/`

---

*Last updated: [DATE]*
