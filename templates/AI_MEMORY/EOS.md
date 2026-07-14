# EOS (END-OF-SESSION) PROTOCOL

**Purpose:** Фиксация результатов сессии и сохранение чекпоинта.
**When to use:** В конце каждой сессии или по завершении крупной задачи.

---

## 1. Вызов EOS (Запуск)
Вызовите инструмент MCP-сервера `execute_eos(project_root: "[ROOT]")`.
Сервер выполнит QA-проверку (сканирование изменений, валидацию задач) и сгенерирует `checkpoint-latest.json` с актуальными метаданными.

*Если MCP-сервер недоступен, выполните процедуру вручную:*
1. Соберите изменения (`git diff --name-only` и `git log` с последнего чекпоинта).
2. Запишите `checkpoint-latest.json` с полями: `timestamp`, `active_task`, `next_step`, `blockers`, `changed_files`.

---

## 2. Обязательные действия агента перед EOS:
1. **`session_log.md`:** Добавьте 5-пунктовое резюме сессии (Что сделано, Что изменено, Блокеры, Решения, NEXT_STEP) в начало файла (prepend).
2. **`tasks/tasks.md`:** Обновите статус задач (ACTIVE_TASK, NEXT_STEP, BLOCKERS).
3. **`other/decisions.md`:** Добавьте новые архитектурные решения (в формате ADR), если они принимались.
4. **Синхронизация:** Обновите `architecture_map.md` и `knowledge_index.md`, если были созданы новые файлы или модули.
5. **Git Commit:** Если пользователь запросил коммит, выполните `git add .` и `git commit -m "[описание]"`.

---

## 3. Итоговый вывод
После успешного вызова `execute_eos` выведите в чат:
```
CHECKPOINT SAVED: {ACTIVE_TASK, NEXT_STEP, BLOCKERS}
```
