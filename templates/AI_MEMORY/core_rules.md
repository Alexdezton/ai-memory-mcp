# CORE RULES - AI MEMORY SYSTEM

**Last saved:** [DATE] (GENERIC TEMPLATE)

---

## AI MEMORY SYSTEM

**Your role:**
You are an autonomous AI agent working on this project. You do NOT keep memory between sessions. Therefore, you MUST rely entirely on the AI_MEMORY folder.

### Golden Rules:
1. Never assume prior knowledge. Always load memory first.
2. Never hallucinate missing data — if something is missing, ask.
3. Never overwrite historical files (decisions, session logs). Only append/prepend.
4. core_rules.md always defines your behavior. Do not modify it without explicit order.
5. Before ANY action — run LOADER.
6. After completing a logical block of work — run EOS automatically unless user said otherwise.
7. **ALWAYS read `AI_MEMORY/specifications/` BEFORE implementing or analyzing code** — specifications are the single source of truth for business logic.
8. **Держите документацию в актуальном состоянии:** Любое добавление новых файлов исходного кода, изменение структуры директорий или изменение внешних зависимостей ОБЯЗАНО быть сразу отражено в `AI_MEMORY/architecture_map.md` и `AI_MEMORY/knowledge_index.md` до завершения сессии (при вызове EOS).
9. **Фиксация обсуждений (Brainstorming):** Любое обсуждение с пользователем архитектурных вопросов, выбора стека, интерфейса или дизайна является мозговым штурмом и ОБЯЗАНО документироваться в папке `AI_MEMORY/brainstorm/` с помощью вызова инструмента `log_brainstorm`.
10. **Лог архитектурных решений (Decisions):** Каждое утвержденное решение (выбор СУБД, библиотек, паттернов, структуры CSS) должно быть немедленно записано в `AI_MEMORY/decisions.md` с помощью инструмента `add_log_entry` в режиме `prepend`.
11. **Синхронизация процедур (Procedures):** Все согласованные команды запуска, сборки, тестирования и развертывания проекта должны быть задокументированы в `AI_MEMORY/procedures.md`.

### 🚨 MANDATORY FIRST READ:

**BEFORE doing ANY work, read:** `AI_MEMORY/AGENT_DISCIPLINE.md`

This file contains MANDATORY behavioral protocol:
- Why protocols are LAW (not recommendations)
- Verify BEFORE action
- Zero unsolicited improvements (except in development mode - RULE 2.1)
- Sequential thinking (efficiency, budget consciousness)
- Respect existing architecture

**YOU will follow them. Read AGENT_DISCIPLINE.md NOW.**

---

## PROJECT STATE

**Current state:** `development`

- `development` — Agent offers ideas and alternatives (RULE 2.1 in AGENT_DISCIPLINE.md)
- `release` — Strict execution only (RULE 2)

**To change state:** User types `SET PROJECT_STATE [development|release]`

---

### 📝 PREPEND SYSTEM — Новые записи в НАЧАЛЕ файлов

**КРИТИЧЕСКОЕ ПРАВИЛО:** Prepend-система применяется ТОЛЬКО к файлам, которые содержат пометку `⚠️ PREPEND FILE` в начале. НЕ применяй prepend ко всем файлам подряд — только к тем, где явно указано это правило. Остальные файлы используют естественную логику (append) или имеют свой формат (например, `brainstorm/` — каждый файл = отдельная тема).

**Зачем:** Агент видит свежие записи сразу при чтении первых строк. Старая история остаётся ниже — агент читает её только при необходимости. Это экономит токены и время.

**Файлы с prepend-системой:**
- `decisions.md` — новые решения вверху, старые внизу
- `session_log.md` — новые сессии вверху, старые внизу

**Файлы с естественной логикой (append):**
- `tasks.md` — новые задачи внизу, выполненные остаются внизу как история
- `brainstorm/` — каждый файл = отдельная тема. Формат: `01_[theme].md`, `02_[theme].md`. Новая тема = новый файл. Дополнение темы = append в существующий файл.

**Как писать:** При добавлении новой записи — помести её **ПЕРЕД** существующими записями, сразу после заголовка и разделителя.

**Пример (decisions.md):**
```markdown
# DECISIONS LOG
---
## 2026-07-06 — Новое решение (САМОЕ СВЕЖЕЕ, ВВЕРХУ)
...
---
## 2026-07-01 — Старое решение (НИЖЕ, СТАРАЯ ИСТОРИЯ)
...
```

**Преимущества:**
- Агент читает 20-50 строк и видит всё свежее
- Не нужно скроллить/читать весь файл до конца
- Старая история доступна при углублённом анализе
- Экономия токенов и времени

**Файлы БЕЗ prepend (пишут в конец):**
- `architecture_map.md` — структура, не лог
- `procedures.md` — процедуры, не лог
- `knowledge_index.md` — маппинг, не лог
- `specifications/` — спеки, не лог
- `checkpoint-latest.json` — всегда один объект (перезаписывается)

---

### Folder structure — Назначение каждого файла:

→ Полная карта AI_MEMORY: [`agent.md`](AI_MEMORY/agent.md) — Раздел 2

**Философия AI_MEMORY:** Каждый файл имеет своё назначение. Файлы НЕ дублируют друг друга. Один файл = одна ответственность.

| Файл | Назначение |
|------|-----------|
| `core_rules.md` | Правила поведения агента, LOADER, EOS, лимиты файлов |
| `agent.md` | Карта всех файлов, need→read таблица, субагенты, GIT COMMIT |
| `AGENT_DISCIPLINE.md` | Поведенческий протокол (проверка, бюджет, последовательность) |
| `tasks.md` | Задачи (EPIC + TASK), ACTIVE_TASK, NEXT_STEP |
| `LOADER.md` | Протокол запуска сессии (команда LOADER) |
| `EOS.md` | Протокол окончания сессии (команда EOS) |
| `COMMANDS.md` | Справочник команд для пользователя и агента |
| `documentation_sync_rules.md` | Карта триггеров: что изменилось → какой файл обновить |
| `decisions.md` | Лог принятых решений (PREPEND, новые вверху) |
| `session_log.md` | Лог сессий (PREPEND, новые вверху) |
| `architecture_map.md` | Архитектура системы, компоненты, связи |
| `project_overview.md` | Краткое описание проекта, стек, статус |
| `procedures.md` | Команды запуска, билда, деплоя, миграции БД |
| `knowledge_index.md` | Маппинг концептов к файлам кода (разгружает agent.md) |
| `specifications/` | Детальные спецификации фич и бизнес-логики |
| `brainstorm/` | Протоколы совещаний и обсуждений |
| `other/` | Архив старых файлов |

**Правило:** НЕ создавать новые файлы в корне AI_MEMORY.

### LOADER (startup self-check) — МИНИМАЛЬНЫЙ КОНТЕКСТ:
1. Read ONLY 3 files:
   - `core_rules.md` → Правила, PROJECT_STATE
   - `tasks.md` → Задачи, ACTIVE_TASK, NEXT_STEP
   - `checkpoint-latest.json` → Состояние (если есть)
2. If checkpoint-latest.json exists, read it first and print compressed state.
3. After loading: output
   **"AI_MEMORY LOADED"**
   and compressed state: ACTIVE_TASK, NEXT_STEP, BLOCKERS, PROJECT_STATE.
4. Read other files ONLY as needed (see agent.md Раздел 2.1 for file mapping).

### EOS (end-of-session checkpoint):

**CRITICAL: When user types "EOS" → MANDATORY FULL PROTOCOL:**

1. **Read AI_MEMORY/EOS.md FIRST**

2. **PHASE 1: Information Gathering (DO NOT SKIP!)**
   - Read checkpoint-latest.json → get timestamp of last checkpoint
   - Run: `git log --since="<timestamp>" --oneline` → get ALL commits
   - Read decisions.md → find new entries after timestamp
   - Search for major code changes
   - COMPILE COMPLETE LIST of ALL work items

3. **PHASE 2: Create Summary & Update Files** (only after gathering ALL info)
   - Create 5-point summary including EVERYTHING from compiled list
   - Append summary to session_log.md
   - Update tasks.md statuses (ACTIVE_TASK, next_step)
   - Append new decisions to decisions.md (if any)
   - Generate checkpoint-latest.json with complete changed_files list
   
4. **Output: "✅ CHECKPOINT SAVED"** + list of updated files

**NEVER skip PHASE 1 (information gathering)!**  

### Behavior:
- Your memory = files inside AI_MEMORY.
- All knowledge, tasks, plans, and architecture must go into these files.
- NOTHING is remembered unless written in AI_MEMORY.
- Every new session must start with LOADER.
- Every session end must include EOS.

### Чистота рабочего пространства и временные файлы

- **Удаление артефактов установки:** Агент **ОБЯЗАН** немедленно удалять любые временные склонированные репозитории, дистрибутивы, временные скрипты и сборочные папки (например, папку исходного кода MCP-сервера `ai-memory-mcp/` после локальной сборки) из корня проекта, как только соответствующий инструмент успешно установлен, скомпилирован и зарегистрирован глобально в IDE.
- **Использование инструмента очистки:** Для удаления лишних папок и файлов используйте инструмент `cleanup_workspace`, поддерживая рабочую директорию в идеальной чистоте.

---

## File Size Control Protocol — КРИТИЧЕСКОЕ ПРАВИЛО

**Purpose:** НИ ОДИН файл проекта не должен превышать 1000 строк.

### Философия модульности и культура кода:
- **Не техническое ограничение, а стандарт качества:** Лимит в 1000 строк введен для поддержания высокой читаемости, тестируемости и модульности кода. Мы пишем чистый, слабосвязанный код.
- **🚨 КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА ИСКУССТВЕННОЕ СЖАТИЕ:** Запрещено обходить лимиты путем удаления переносов строк, слияния нескольких инструкций в одну строчку, удаления комментариев, сокращения пробелов или объединения логики «в кучу». Любое искусственное ухудшение читаемости ради экономии строк считается грубым нарушением стандартов проекта.
- **🚨 ОБЯЗАТЕЛЬНОЕ ИСПОЛЬЗОВАНИЕ NATIVE WRITE + VERIFY_WRITE:** Для создания или модификации любых файлов в рабочей директории проекта (за пределами папки `AI_MEMORY`) агент **ОБЯЗАН** использовать встроенный инструмент IDE `write_to_file`. **Сразу после записи** каждого файла агент **ОБЯЗАН** вызвать инструмент MCP-сервера `verify_write`, передав в него путь к записанному файлу. Использование инструментов других MCP-серверов (например, `filesystem/write_file`) запрещено. Завершение изменений без успешного вызова `verify_write` является нарушением протокола безопасности и контроля качества.
- **Единственный верный путь — рефакторинг:** Если объем кода превышает 800 строк, вы обязаны разделить его на логические модули/файлы и связать их с помощью импортов (`import`, `require`, `@import` и т.д.).

### Universal Limits

| Тип файла | Hard limit | Warning threshold |
|-----------|------------|-------------------|
| Любой файл проекта | 1000 строк | 800 строк |
| `agent.md` | **600 строк** | 500 строк |
| AI_MEMORY core files | 500 строк | 400 строк |
| `decisions.md`, `session_log.md` | Без лимита (append-only) | — |

### Мандат при достижении 800 строк

**ПРИ ПРИБЛИЖЕНИИ К 800 СТРОКАМ АГЕНТ ОБЯЗАН ОСТАНОВИТЬСЯ И ПРОВЕСТИ РЕФАКТОРИНГ:**
1. Разделить логику на независимые модули
2. Вынести вспомогательные функции, интерфейсы, компоненты в отдельные файлы
3. **НЕ удалять** старый код до полной проверки работоспособности новых файлов

### Специфика: Веб-сервисы (Backend API)

При создании API (Python/FastAPI и т.д.) — НЕ сваливать маршруты, бизнес-логику и БД в один файл:

- **Роутеры** — остаются в основном файле маршрутов
- **Бизнес-логика** → `services/` директория
- **Работа с БД** → `models/` или `repositories/` директория

### Специфика: Мобильные приложения (React Native / Flutter)

Файлы экранов НЕ должны превышать 1000 строк:

- **Переиспользуемые UI-элементы** → `components/` директория
- **Управление состоянием + API-запросы** → отдельные классы/хуки (state/, hooks/)
- **Стили/темы** → отдельные файлы стилей

### 🔒 Безопасный рефакторинг (КРИТИЧЕСКОЕ ПРАВИЛО)

**Перед разделением файла > 800 строк агент ОБЯЗАН:**

1. **Создать резервную копию** исходного файла:
   - `[имя_файла]_backup.[расширение]`
   - ИЛИ предложить пользователю сделать git commit текущего состояния

2. **Запрещено удалять старый код** до полной проверки работоспособности всех новых файлов

3. **После разделения:**
   - Проверить что новые файлы компилируются/работают
   - Удалить backup только после подтверждения пользователя

### AI_MEMORY File Limits

- `agent.md` — **максимум 600 строк**. При приближении к 500 — вынести подробности в `specifications/` или `other/`
- `architecture_map.md` — максимум 500 строк
- `procedures.md` — максимум 500 строк
- `knowledge_index.md` — максимум 500 строк
- При приближении к лимиту → создать спецификацию, оставить краткую ссылку

---

**This is the complete and final operating protocol.**
