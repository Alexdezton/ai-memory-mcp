# LOADER COMMAND

**Purpose:** Загрузить МИНИМУМ контекста для старта работы. Остальное — по мере необходимости.

**When to use:** В начале КАЖДОЙ сессии, перед любой работой.

---

## Command:

```
LOADER [TIME]
```

**Example:** `LOADER 4:30 pm`

---

## What the Agent Does:

### ШАГ 1: Минимальная загрузка (Через MCP или вручную)

**ОСНОВНОЙ ВАРИАНТ (Если установлен MCP-сервер `ai-memory-mcp`):**
- Вместо чтения файлов вручную, **ВЫЗОВИ инструмент `execute_loader(user_time: "[TIME]")`**.
- Он автоматически прочитает файлы на стороне сервера, обновит `LAST_LOADER.json` и вернет готовую строку статуса.

**РЕЗЕРВНЫЙ ВАРИАНТ (Если MCP-сервер не подключен):**
1. Агент читает ТОЛЬКО 3 файла:
   - `core_rules.md` → Правила поведения, PROJECT_STATE, prepend-система
   - `tasks/tasks.md` → Актуальные задачи, ACTIVE_TASK, NEXT_STEP, BLOCKERS
   - `checkpoint-latest.json` → Сжатое состояние (если существует)
2. Записывает в `LAST_LOADER.json`: `{"timestamp": "[USER_TIME], [DATE]"}`

**ИТОГО: Агент знает ПРАВИЛА + ЧТО ДЕЛАТЬ.**

### ШАГ 2: Вывод статуса

```
AI_MEMORY LOADED

ACTIVE_TASK: [ID и название текущей задачи]
NEXT_STEP: [Конкретный следующий шаг]
BLOCKERS: [Блокеры или "None"]
PROJECT_STATE: [development|release]
```

### ШАГ 3: Выполнение NEXT_STEP

Агент начинает выполнять NEXT_STEP. Если нужны дополнительные файлы — читает по необходимости (таблица маппинга в `agent.md` Раздел 2.1).

---

## ПОЧЕМУ МИНИМУМ:

- 8 файлов при загрузке = wasted context tokens
- Агенту нужны ПРАВИЛА + ЗАДАЧИ для старта
- Остальное — по мере необходимости (экономия токенов)
- `agent.md` содержит полную карту файлов — ссылки на всю архитектуру

---

## Full Command Template:

```
LOADER: Перед любым действием выполни:

1) ЕСЛИ доступен MCP-сервер "ai-memory-mcp" -> вызови инструмент "execute_loader" с аргументом user_time = [USER_TIME]
2) ИНАЧЕ (вручную):
   - read("AI_MEMORY/core_rules.md") — правила, PROJECT_STATE
   - read("AI_MEMORY/tasks/tasks.md") — задачи, ACTIVE_TASK, NEXT_STEP
   - read("AI_MEMORY/checkpoint-latest.json") — состояние (если есть)
   - Обнови "AI_MEMORY/LAST_LOADER.json" -> {"timestamp": "[USER_TIME], [DATE]"}

Выведи полученный статус: "AI_MEMORY LOADED. ACTIVE_TASK: [ID и название], NEXT_STEP: [Шаг], BLOCKERS: [Блокеры], PROJECT_STATE: [development|release]".
Начни выполнять NEXT_STEP. Читай остальные файлы ТОЛЬКО по необходимости.
```

---

**Note:** Команда "LOADER" = запуск execute_loader (MCP) или чтение 3 файлов вручную. Остальное — по мере необходимости.
