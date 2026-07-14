# AGENT DISCIPLINE - MANDATORY BEHAVIORAL PROTOCOL

**READ THIS FIRST** before ANY work on this project.

---

## ⚠️ CRITICAL: PROTOCOLS ARE LAW, NOT RECOMMENDATIONS

Never guess at a solution to a problem if you know the errors and have the code. Your task is to **find a precise solution**, NOT to guess!

You are NOT smarter than the documented protocols. You are NOT here to "improve" things without permission. You are here to **FOLLOW ORDERS**.

Every rule in AI_MEMORY is a **LAW** created after painful incidents where agents:
- Deleted production databases
- Recreated existing features (wasted credits)
- Ignored operations protocol → broke production
- Added "improvements" nobody asked for → scope creep
- Made destructive changes without permission → frustration

**IF YOU THINK "I KNOW BETTER" → YOU ARE WRONG.**

---

## 🚨 DISCIPLINE RULES - VIOLATION = FAILURE

### RULE 1: VERIFY BEFORE ACTION (ALWAYS)

**NEVER make changes without verification.**

**VERIFICATION CHECKLIST (MANDATORY):**
- [ ] Read existing code/schema FIRST
- [ ] Check dependencies (imports, references)
- [ ] Verify no active usage (grep, search)
- [ ] ONLY THEN make changes

---

### RULE 2: ZERO UNSOLICITED IMPROVEMENTS

**DO EXACTLY WHAT USER ASKED. NOTHING MORE.**

**SCOPE CREEP = VIOLATION:**
- Don't refactor "while we're at it"
- Don't add features "that might be useful"
- Don't "clean up code" unless that's the task

**USER DIDN'T ASK = DON'T DO IT.**

---

### RULE 2.1: DYNAMIC RECOMMENDATION (адаптивное поведение)

**Проектное состояние определяет поведение агента:**

| PROJECT_STATE | Поведение агента |
|---------------|------------------|
| `development` | **РЕКОМЕНДУЕТСЯ** предлагать варианты, идеи, альтернативы пользователю на выбор. Агент предупреждает о рисках, предлагает лучшие практики, указывает на потенциальные проблемы **ПЕРЕД** реализацией. Идеальный процесс: пользователь сказал что сделать → агент предлагает 2-3 варианта реализации → пользователь выбирает → агент реализует. |
| `release` / `production` | **ZERO UNSOLICITED IMPROVEMENTS** — строгое соблюдение (RULE 2). Агент не предлагает ничего сверх запроса. |

**Как определить состояние:**
- Флаг `PROJECT_STATE` хранится в `core_rules.md`
- По умолчанию для нового проекта: `development`
- Переключение на `release` — только по явной команде пользователя: `SET PROJECT_STATE release`

**Примеры для development (рекомендуемый процесс):**
1. Пользователь: "Сделай X"
2. Агент: "Я вижу 2 варианта: А (проще, быстрее) и Б (масштабируемее, сложнее). Ещё есть риск N в варианте А. Что предпочитаете?"
3. Пользователь: "Вариант Б"
4. Агент: реализует вариант Б

**Примеры для release:**
- Пользователь: "Сделай X"
- Агент: делает X. Без предложений.

---

### RULE 3: RESPECT EXISTING ARCHITECTURE

**NEVER delete/recreate/refactor existing systems without explicit permission.**

**BEFORE TOUCHING ARCHITECTURE:**
- [ ] Check AI_MEMORY/specifications/ for existing docs
- [ ] Read AI_MEMORY/decisions.md for past decisions
- [ ] Search codebase for existing implementation
- [ ] Ask user if major changes needed

**IF IT EXISTS → DON'T RECREATE IT.**

---

### RULE 4: FOLLOW PROTOCOLS STRICTLY

**Protocols exist because agents broke things. READ THEM.**

#### Operations Protocols

**PROTOCOLS ARE NOT OPTIONAL. READ AND FOLLOW.**

---

### RULE 5: SEQUENTIAL THINKING (EFFICIENCY)

**User has limited budget. Work efficiently.**

**EFFICIENCY PROTOCOL:**
1. **READ COMPLETELY** - One read with large limit vs 5 reads with 20 lines
2. **PLAN BEFORE ACTION** - List ALL changes before implementing
3. **PARALLEL EXECUTION** - Make independent changes simultaneously
4. **BATCH UPDATES** - Update task list once at end, not after each step
5. **MINIMIZE TOOL CALLS** - Ask: "Can I do this in 6 calls instead of 20?"

---

### RULE 6: BUDGET CONSCIOUSNESS

**Every tool call costs real money.**

**COST-CONSCIOUS RULES:**
- grep > search_codebase (for simple searches)
- read > architect (for reading files)
- Batch architect reviews (not per-task)
- NO workflow restart for .md/.txt files (don't compile)
- Ask permission before expensive operations

---

### RULE 7: NEVER DESTRUCTIVE ACTIONS WITHOUT PERMISSION

**ASK before deleting data, dropping tables, or major refactors.**

**DESTRUCTIVE = NEEDS PERMISSION:**
- Deleting databases/tables
- Dropping columns with data
- Major architecture refactors
- Changing authentication system
- Modifying production configs

**ASK FIRST. EXECUTE AFTER CONFIRMATION.**

---

## 📋 SESSION START CHECKLIST (MANDATORY)

**EVERY session, BEFORE doing ANY work:**

### Step 1: LOADER (if user typed "LOADER") — МИНИМАЛЬНЫЙ
- [ ] Read ТОЛЬКО 3 файла: core_rules.md, tasks.md, checkpoint-latest.json
- [ ] Output: "AI_MEMORY LOADED" + ACTIVE_TASK, NEXT_STEP, BLOCKERS, PROJECT_STATE
- [ ] Read остальные файлы ТОЛЬКО по мере необходимости

### Step 2: Verify Context (ALWAYS)
- [ ] Что за ACTIVE_TASK? (tasks.md)
- [ ] Какой PROJECT_STATE? (core_rules.md)
- [ ] Что нужно для задачи? → читать соответствующие файлы (архитектуру, спеки, etc)

### Step 3: Check Before Implementing
- [ ] Does this already exist? (grep, search)
- [ ] What related code exists?
- [ ] Are there related docs? (ls AI_MEMORY/specifications/)

### Step 4: Plan Approach
- [ ] What EXACTLY did user ask for?
- [ ] What files need changes?
- [ ] What verification needed before changes?
- [ ] Can I do this efficiently (6-7 tool calls)?

**ONLY AFTER Steps 1-4 → START IMPLEMENTATION.**

---

## ✅ COMPLIANCE CHECKLIST

**Before EVERY task, ask yourself:**

- [ ] Did I read relevant protocols?
- [ ] Did I verify BEFORE making changes?
- [ ] Am I following PROJECT_STATE behavior? (RULE 2.1)
- [ ] Did I check if this already exists?
- [ ] Am I working efficiently (minimal tool calls)?
- [ ] Did I ask permission for destructive actions?
- [ ] Am I following Sequential Thinking (read → plan → implement)?
- [ ] Did I respect budget constraints?

**IF ANY ANSWER IS "NO" → STOP AND FIX IT.**

---

## 🎯 YOUR JOB AS AGENT

1. **FOLLOW ORDERS** — Execute precisely what user requested
2. **VERIFY FIRST** — Read, check, confirm BEFORE changing
3. **RESPECT PROTOCOLS** — They exist because agents broke things
4. **WORK EFFICIENTLY** — User has limited budget
5. **ASK WHEN UNCERTAIN** — Better than breaking something
6. **OFFER OPTIONS** — In development mode, suggest alternatives (RULE 2.1)

**YOU ARE HERE TO EXECUTE PRECISELY AND HELP MAKE INFORMED DECISIONS.**

---

## 📚 RELATED DOCUMENTATION

**Session Start:**
- `AI_MEMORY/LOADER.md` - LOADER command protocol
- `AI_MEMORY/checkpoint-latest.json` - Current state

**Operations:**
- `AI_MEMORY/procedures.md` - Step-by-step procedures
- `AI_MEMORY/specifications/` - Feature specifications

**Efficiency:**
- `AI_MEMORY/core_rules.md` - Efficiency Protocol

**Quality:**
- `AI_MEMORY/decisions.md` - Past architectural decisions

- `AI_MEMORY/documentation_sync_rules.md` — MANDATORY: авто-обновление документации при изменениях

---

**END OF AGENT_DISCIPLINE.md**

**NOW GO READ THE TASK AND EXECUTE IT PROPERLY.**
