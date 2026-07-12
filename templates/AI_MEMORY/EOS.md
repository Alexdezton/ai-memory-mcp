# EOS COMMAND

**Purpose:** Save session progress and create checkpoint for next session.

**When to use:** At the end of each work session or after completing a logical block of work.

---

## ⚠️ MANDATORY PRE-EOS CHECKLIST

**Before executing EOS, you MUST check these files based on work type:**

### Always Required:
- [ ] `session_log.md` - Append summary
- [ ] `tasks.md` - Update statuses, ACTIVE_TASK, next_step
- [ ] `checkpoint-latest.json` - Update
- [ ] `decisions.md` - Append if architectural decisions made

### Check if Database/Architecture Changes:
- [ ] `specifications/DATA_MODEL.md` - Schema changes?
- [ ] `architecture_map.md` - New components/modules?

### Check if New Features/Components:
- [ ] `knowledge_index.md` - New files/components mapping?
- [ ] `project_overview.md` - New features list?

### Check if Critical Business Logic:
- [ ] `specifications/` folder - Need new detailed spec file?

**If unsure which files need updates → ASK YOURSELF:**
1. Did I change database schema? → Update DATA_MODEL.md + architecture_map.md
2. Did I add new features? → Update project_overview.md
3. Did I create new components? → Update knowledge_index.md
4. Did I make architectural decisions? → Update decisions.md

---

## Command to Send:

```
EOS
```

or

```
SAVE_AND_CHECKPOINT
```

---

## 🔍 PHASE 1: INFORMATION GATHERING (MANDATORY - DO NOT SKIP!)

**CRITICAL:** Before creating summary, you MUST execute this checklist to gather ALL information since last checkpoint.

### Step 1: Find Last Checkpoint Timestamp

```bash
# Read checkpoint file to get timestamp
read AI_MEMORY/checkpoint-latest.json
# Look for: "timestamp": "2025-12-02T03:30:00Z"
```

### Step 2: Collect ALL Changes Since Checkpoint

```bash
# Get ALL commits since last checkpoint
git log --since="<timestamp_from_checkpoint>" --oneline --all

# Read new decisions made after checkpoint
read AI_MEMORY/decisions.md
# Look for entries with dates after checkpoint timestamp

# Read recent meetings/discussions
read AI_MEMORY/brainstorm/ (новые файлы по датам)
# Check for new meetings added

# Search for major code changes
git diff --name-only HEAD@{0} (или git log --since="<timestamp>" --name-only)
# Look for: миграции, новые компоненты, сервисы
```

### Step 3: Compile Complete Work List

Create COMPLETE list of ALL work items found:
- **Architecture changes**: новые модули, компоненты, сервисы
- **New features**: UI компоненты, сервисы, экраны
- **Bug fixes**: исправления, корректировки
- **Documentation updates**: specifications, decisions

### Step 4: Verify Completeness

**Ask yourself before proceeding:**
- [ ] Did I check `git log` since last checkpoint timestamp?
- [ ] Did I read ALL new entries in `decisions.md`?
- [ ] Did check `brainstorm/` for new discussions?
- [ ] Did I search codebase for major changes?
- [ ] Do I have COMPLETE list of work items?
- [ ] Can I write 5-point summary that includes EVERYTHING?

### ⚠️ CRITICAL RULES:

1. **NEVER skip this phase!**
2. **NEVER start writing summary without gathering ALL information first!**
3. **User should NOT have to remind you "check previous sessions"!**
4. **If you miss work items → incomplete checkpoint → user wastes credits fixing it!**

**ONLY AFTER completing Steps 1-4 → proceed to PHASE 2 below**

---

## PHASE 2: CREATE SUMMARY & UPDATE FILES

### What the Agent Will Do:

### 1. Create Summary (5 points):
- What was done
- What changed (files/fragments)
- Decisions made (append to decisions.md)
- Blockers encountered
- NEXT_STEP (specific next action)

### 2. Update AI_MEMORY Files:
- Append summary to `session_log.md`
- Update `tasks.md` statuses (mark completed, update ACTIVE_TASK, set next_step)
- Append new decisions to `decisions.md` (if any)

### 3. Generate Checkpoint:
- Create/update `checkpoint-latest.json` with:
  ```json
  {
    "timestamp": "...",
    "active_task": "...",
    "next_step": "...",
    "blockers": [...],
    "changed_files": [...]
  }
  ```

### 4. Git commit (если команда GIT COMMIT):
- git add .
- git commit -m "[описание изменений]"

### 5. Output Confirmation:
```
CHECKPOINT SAVED: {ACTIVE_TASK, NEXT_STEP, BLOCKERS}
```

---

## Full Command Template (Optional - for clarity):

```
EOS / SAVE_AND_CHECKPOINT:

1) Составь summary (5 пунктов):
   - Что сделано
   - Что изменено (файлы/фрагменты)
   - Решения (append to decisions.md)
   - Блокеры
   - NEXT_STEP (конкретный шаг)

2) Добавь summary в AI_MEMORY/session_log.md
3) Обнови AI_MEMORY/tasks.md (статусы, ACTIVE_TASK, next_step)
4) Добавь новые решения в AI_MEMORY/decisions.md
5) Создай AI_MEMORY/checkpoint-latest.json с полями:
   {"timestamp": "...", "active_task":"...", "next_step":"...", "blockers":[...], "changed_files":[...]}
6) Если пользователь сказал "GIT COMMIT" — git add . && git commit -m "[описание]"
7) Выведи одну строку: "CHECKPOINT SAVED: {ACTIVE_TASK, NEXT_STEP, BLOCKERS}"
```

---

## Expected Output Example:

```
CHECKPOINT SAVED: {
  ACTIVE_TASK: "TASK-X - [название задачи]",
  NEXT_STEP: "[конкретный следующий шаг]",
  BLOCKERS: []
}

Session summary added to session_log.md
Tasks updated in tasks.md
Checkpoint saved to checkpoint-latest.json
```

---

## When to Use EOS:

- ✅ End of work session (going offline)
- ✅ After completing major feature/task
- ✅ Before switching to different task
- ✅ When context limit approaching (~60-70% of token budget)
- ❌ Not needed for every small change

---

**Note:** Simply typing "EOS" is sufficient. Agent should automatically follow the full procedure.
