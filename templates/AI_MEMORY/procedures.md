# PROCEDURES

**Purpose:** Core infrastructure and development workflows  
**For detailed feature specifications:** See `specifications/` folder

---

## Development Workflow

### Run Application
```bash
[Команда для запуска приложения]
```

### Build
```bash
[Команда для сборки]
```

### Deploy
```bash
[Команда для деплоя]
```

### Test
**Current status:** [Статус тестов]

### Rollback
**Method:** [Способ отката изменений]

---

## Database Migration Tools

### [Скрипт миграции]
**Purpose:** [Назначение скрипта]

**Usage:**
```bash
[Пример использования]
```

**Required Secrets:**
- 

---

## Core Features (See Specifications)

### [Feature 1]
**Purpose:** [Краткое описание]

**See:** `specifications/[FEATURE_NAME].md`

---

## Translation Management

### MANDATORY Protocol
[Протокол работы с переводами]

---

## Database Access Protocol

[Правила доступа к базе данных]

---

## Quality Assurance Before Task Completion

### [Протокол проверки качества]

---

## File Size Limits

**Core files MUST stay under 500 lines:**
- `architecture_map.md`
- `procedures.md`
- `knowledge_index.md`

**When file reaches 400 lines:**
1. Create specification in `specifications/` folder
2. Replace detailed content with brief summary (10-20 lines)
3. Add link: "See specifications/FEATURE_NAME.md"

**See:** `core_rules.md` - File Size Control Protocol
