# CORE RULES - AI MEMORY SYSTEM

**Last saved:** [DATE] (GENERIC TEMPLATE)

---

## 1. Golden Rules
1. **Never assume prior knowledge.** Always run `execute_loader` at the start of the session.
2. **Never hallucinate missing data.** If a feature or task is ambiguous, ask the user.
3. **No Plan Blocker (verify_write):** You MUST create/update `AI_MEMORY/tasks/project_launch_plan.md` before writing code. You MUST run `verify_write` on every modified file immediately after editing.
4. **Zero Unsolicited Improvements:** Follow `development` vs `release` states. In `release`, implement ONLY the exact request.
5. **Session Close (execute_eos):** You MUST run `execute_eos` at the end of the session to save the checkpoint.
6. **Documentation & Spec First:** Always read specifications in `AI_MEMORY/specifications/` before writing logic. Keep documentation in sync.

---

## 2. Project State & Memory Core
* **Current state:** `development` (options: `development` / `release`)
* **Core Folder Structure:** Documented in [knowledge_index.md](knowledge_index.md). Direct file creation in the root of `AI_MEMORY/` or `AI_MEMORY/ai_agent_guidelines/` is forbidden.
* **Prepend Rules:** `decisions.md` (ADR) and `session_log.md` are prepend files (new entries go immediately below the header).

---

## 3. Dynamic File Size Control
* **Enforced Limits:** All file line limits are defined in [mcp_ai_memory_config.json](file:///mcp_ai_memory_config.json) (e.g., maximum code lines, `agent.md` limit).
* **Blocker:** If any file exceeds these limits, `verify_write` will throw `LIMIT_EXCEEDED` and block.
* **Solution:** Do not compress code. Refactor modularly. Move details, lists, or large rules to category subfolders under `ai_agent_guidelines/`, `specifications/` or `other/` and leave a simple markdown link in the core file.
* **Safe Refactoring Standards:** Refer to [SAFE_REFACTORING.md](ai_agent_guidelines/development/SAFE_REFACTORING.md) when splitting files.

---

## 4. Professional Folder Layout
* All source code files must be organized according to the project preset.
* **Blocker:** Direct code placement in the root folder (or outside of `src/` depending on the preset) is forbidden.
* **Standards:** Refer to [PROJECT_STRUCTURE.md](ai_agent_guidelines/architecture/PROJECT_STRUCTURE.md).
