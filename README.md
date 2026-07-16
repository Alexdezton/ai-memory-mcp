# AI Memory MCP Server

A universal local Model Context Protocol (MCP) server designed to standardize the `AI_Memory` documentation structure, enforce strict development limits (line counts), manage nested task trees in Markdown, and automate LOADER/EOS session protocols.

This server acts as a strict guardrail for AI coding assistants, preventing chaotic file creation, keeping file sizes clean and modular, and enforcing planning discipline.

---

## English Documentation (Primary)

### Features & Tools

The server registers 9 core tools:

1. `init_project_memory` — Initializes the `AI_Memory` directory structure and creates the `mcp_ai_memory_config.json` configuration file in the project root by copying standard templates and rules.
2. `verify_write(filepath)` — File writing limits validator:
   - Verifies the file written via native `write_to_file` matches the rules.
   - Prevents files in the root of `AI_Memory/` unless the filename is listed in `allowed_memory_root_files`.
   - Restricts file sizes: code files are limited to `max_code_lines` (default: 1000 lines), and documentation Markdown files are limited to `max_memory_md_lines` (default: 600 lines).
   - **No Plan Blocker:** Rejects verification of source code files (files outside `AI_Memory`) if the global plan `AI_Memory/tasks/project_launch_plan.md` is missing or empty, throwing a `PLAN_MISSING` error.
3. `add_log_entry(filepath, content, mode)` — Smart log entries additions:
   - `prepend` mode — find the first Markdown header/separator block and inserts the log entry immediately under it (new entries stay on top).
   - `append` mode — appends the entry to the end of the file.
4. `manage_task_tree(action, task_id, parent_id, title, status)` — Markdown-based task tree controller:
   - Supports checkbox statuses: `[ ]` (Todo), `[~]` (In Progress), `[x]` (Done) and nested tasks using indentation.
   - Rejects closing parent tasks via `close_task` if any of their child subtasks are not completed (`[x]`).
5. `sync_project_state(component, description)` — Updates system components inside `AI_Memory/architecture_map.md` dynamically:
   - Finds or creates the component block under `## 1. System Components` and replaces details.
   - Updates the last updated date automatically.
6. `log_brainstorm(topic, decisions_summary)` — Automates saving brainstorm logs in `brainstorm/` with auto-incrementing prefixes (`01_topic.md`, `02_topic.md`...) based on the standard protocol.
7. `cleanup_workspace(files_to_delete)` — Automatically removes temporary scripts or test files from the workspace.
8. `execute_loader(user_time)` — Reads active task status, step, and blockers from `tasks/tasks.md` and updates `LAST_LOADER.json` to boot up sessions efficiently.
9. `execute_eos()` — Automates the End of Session protocol by checking modified files via `git log` since the last session timestamp.

---

### Configuration (`mcp_ai_memory_config.json`)

The config file is initialized in the project root:
```json
{
  "max_code_lines": 1000,
  "max_memory_md_lines": 600,
  "allowed_memory_root_files": [
    "LOADER.md",
    "EOS.md",
    "architecture_map.md",
    "core_rules.md",
    "COMMANDS.md",
    "documentation_sync_rules.md",
    "procedures.md",
    "project_overview.md",
    "knowledge_index.md",
    "session_log.md",
    "checkpoint-latest.json",
    "LAST_LOADER.json"
  ]
}
```

### MCP Call History (Logging)

Every action the agent performs while communicating with this MCP server is automatically logged in the file [`AI_MEMORY/mcp_history.log`](file:///AI_MEMORY/mcp_history.log).
* **Zero Token Overhead:** The logging is handled entirely by the Node.js server itself. It does not consume any LLM context or input/output tokens.
* **Exempt from Limits:** The `mcp_history.log` file is automatically ignored during line-limit checks, allowing it to grow freely and preserve the session's action history.

---

### Installation

> [!WARNING]
> **DO NOT** run the server command manually in your terminal (e.g., executing `node build/index.js` as a standalone command line).
> Direct execution starts the stdio server transport which runs in an infinite loop waiting for IDE requests, causing your terminal and agent session to **deadlock/freeze**.
> You only need to register the command inside your IDE's MCP settings or configuration files. The IDE client will spawn and manage the process automatically.

---

### Option A: Global Installation via NPX (Highly Recommended)

NPX is the easiest, cleanest, and recommended way to install and run the server. It runs globally from the npm cache, requires zero workspace clutter, works on empty/clean projects, and automatically fetches updates from GitHub.

##### 1. In Antigravity (`~/.gemini/config/mcp_config.json`)
Add the following to your configuration file (Note for Windows: use `npx.cmd` instead of `npx`):
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx.cmd",
      "args": ["-y", "github:Alexdezton/ai-memory-mcp"]
    }
  }
}
```

##### 2. In VS Code (using Cline / Roo Code / Roo Cline)
Open Cline's settings file (`%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`):
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "github:Alexdezton/ai-memory-mcp"
      ]
    }
  }
}
```

##### 3. In Cursor / Windsurf
Add a new MCP server in Settings -> MCP:
- **Type:** `command`
- **Name:** `ai-memory-mcp`
- **Command:** `npx -y github:Alexdezton/ai-memory-mcp`

##### 4. In Claude Desktop
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "github:Alexdezton/ai-memory-mcp"
      ]
    }
  }
}
```

---

### Option B: Local Clone Installation (For Developers / Offline Use)

If you wish to run the server from a local folder or make custom modifications to it:

1. **Clone the repository** to a persistent global directory of your choice:
   ```bash
   git clone https://github.com/Alexdezton/ai-memory-mcp.git
   ```
2. **Install dependencies:**
   ```bash
   cd ai-memory-mcp && npm install
   ```
   *(Note: The server is written in pure JavaScript ESM, so no build/compile step is needed!)*
3. **Register the server** in your IDE's config using the absolute path to `build/index.js`:
   ```json
   "ai-memory-mcp": {
     "command": "node",
     "args": ["/absolute/path/to/ai-memory-mcp/build/index.js"]
   }
   ```

---

### MCP & Rules Update Protocol

##### 1. Updating the Server Executable
* **If running via Option A (NPX):** No action required! Whenever a new version is pushed to the repository (with a bumped version in `package.json`), NPX will automatically pull the updated code from GitHub on the next launch.
* **If running via Option B (Local Clone):** Simply go to the cloned directory and pull the latest changes:
  ```bash
  git pull
  ```
  *(No compile or build command is needed!)*

##### 2. Dynamic Variables & Updates Protection
* **Dynamic Variable Injection:** All system rules are loaded dynamically from `system_variables.json` inside the MCP server. When `execute_loader` or `init_project_memory` runs, these variables are automatically injected into the project files using placeholders like `{SYSTEM_CORE_RULES}` and boundary comments (`<!-- SYSTEM_..._START -->`).
* **Overwriting Protection:** Any user custom rules placed within the `<!-- USER SECTION START -->` comments are completely ignored by the server and will never be overwritten.
* **Auto-Backups:** During initialization or updates, the server creates a temporary copy of the `AI_MEMORY/` directory in the operating system's Temp directory (`os.tmpdir()/ai_memory_backup_*`). If anything fails, you can find the backup there.

---

## Документация на русском языке

### Функционал и инструменты (Tools)

Сервер регистрирует 9 основных инструментов для автоматизации:

1. `init_project_memory` — Инициализирует структуру директории `AI_Memory` и создает конфигурационный файл `mcp_ai_memory_config.json` в корне проекта, копируя стандартные шаблоны и правила.
2. `verify_write(filepath)` — Валидатор лимитов и правил записи:
   - Проверяет файл, сохраненный через нативный инструмент `write_to_file`.
   - Блокирует создание файлов непосредственно в корне `AI_Memory/`, если их имя отсутствует в `allowed_memory_root_files`.
   - Контролирует количество строк: файлы кода ограничены `max_code_lines` (1000 строк по умолчанию), markdown-документы памяти ограничены `max_memory_md_lines` (600 строк по умолчанию).
   - **Блокировка без плана (Blocker):** Блокирует прохождение верификации для файлов кода, если глобальный план запуска `AI_Memory/tasks/project_launch_plan.md` отсутствует или пуст.
3. `add_log_entry(filepath, content, mode)` — Умное добавление записей в логи:
   - Режим `prepend` — находит первый заголовок/разделитель Markdown и вставляет запись строго под ним (новые записи всегда сверху).
   - Режим `append` — добавляет запись в конец файла.
4. `manage_task_tree(action, task_id, parent_id, title, status)` — Управление деревом задач:
   - Поддерживает статусы чекбоксов: `[ ]` (Todo), `[~]` (In Progress), `[x]` (Done) и вложенность подзадач с отступами.
   - Блокирует закрытие родительской задачи (`close_task`), если хотя бы одна её дочерняя подзадача не переведена в статус выполненной (`[x]`).
5. `sync_project_state(component, description)` — Синхронизация архитектуры:
   - Находит или создает блок компонента в `AI_Memory/architecture_map.md` под заголовком `## 1. Компоненты системы` и обновляет его содержимое.
   - Автоматически обновляет дату последнего изменения.
6. `log_brainstorm(topic, decisions_summary)` — Запись мозговых штурмов:
   - Создает протокол в папке `brainstorm/` с автоинкрементным префиксом (`01_topic.md`, `02_topic.md`...) по стандартному шаблону.
7. `cleanup_workspace(files_to_delete)` — Автоматическое удаление временных и мусорных файлов из рабочей директории.
8. `execute_loader(user_time)` — Быстрый запуск сессии. Считывает статус проекта, активную задачу, шаг и блокеры из `tasks/tasks.md` и обновляет файл `LAST_LOADER.json`.
9. `execute_eos()` — Завершение сессии. Автоматически опрашивает `git log` на предмет измененных файлов и коммитов с момента последнего чекпоинта.

---

### Конфигурация (`mcp_ai_memory_config.json`)

Конфигурационный файл инициализируется в корне проекта при запуске:
```json
{
  "max_code_lines": 1000,
  "max_memory_md_lines": 600,
  "allowed_memory_root_files": [
    "LOADER.md",
    "EOS.md",
    "architecture_map.md",
    "core_rules.md",
    "COMMANDS.md",
    "documentation_sync_rules.md",
    "procedures.md",
    "project_overview.md",
    "knowledge_index.md",
    "session_log.md",
    "checkpoint-latest.json",
    "LAST_LOADER.json"
  ]
}
```

### История вызовов (Логирование MCP)

Каждое действие агента при взаимодействии с сервером автоматически записывается на диске в файл [`AI_MEMORY/mcp_history.log`](file:///AI_MEMORY/mcp_history.log). 
* **Как это работает:** Запись лога производится скрытно на стороне Node.js-сервера, что гарантирует **нулевой расход токенов** модели и отсутствие задержек в производительности.
* **Исключение из лимитов:** Файл `mcp_history.log` автоматически исключен из проверок лимита строк, что позволяет ему беспрепятственно накапливать историю сессии.

---

### Установка

> [!WARNING]
> **НЕ ЗАПУСКАЙТЕ** команду сервера вручную в терминале (например, выполняя `node build/index.js` в командной строке).
> Прямой запуск запускает stdio-транспорт сервера, который работает в бесконечном цикле ожидания запросов от IDE. Это приведет к **зависанию (deadlock)** вашего терминала и сессии агента.
> Вам нужно лишь зарегистрировать эту команду в настройках MCP вашей IDE или в файлах конфигурации. Клиент IDE сам запустит процесс на фоне по мере необходимости.

---

### Вариант А: Глобальная установка через NPX (Рекомендуемый способ)

Использование `npx` — это самый простой, чистый и надежный способ запуска. Сервер работает из глобального кэша npm, не забивает файлы проекта папками `node_modules`, работает в чистых проектах и автоматически скачивает обновления с GitHub.

##### 1. В Antigravity (`~/.gemini/config/mcp_config.json`)
Добавьте в файл конфигурации (Примечание для Windows: используйте `npx.cmd` вместо `npx`):
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx.cmd",
      "args": ["-y", "github:Alexdezton/ai-memory-mcp"]
    }
  }
}
```

##### 2. В VS Code (через расширения Cline / Roo Code / Roo Cline)
Откройте файл настроек MCP (`%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`):
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx",
      "args": ["-y", "github:Alexdezton/ai-memory-mcp"]
    }
  }
}
```

##### 3. В Cursor / Windsurf
Добавьте новый MCP-сервер в настройках (Settings -> MCP):
- **Type:** `command`
- **Name:** `ai-memory-mcp`
- **Command:** `npx -y github:Alexdezton/ai-memory-mcp`

##### 4. В Claude Desktop
Добавьте в ваш `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "ai-memory-mcp": {
      "command": "npx",
      "args": ["-y", "github:Alexdezton/ai-memory-mcp"]
    }
  }
}
```

---

### Вариант Б: Локальный клон репозитория (Для разработчиков / оффлайн работы)

Если вы хотите запускать сервер из локальной папки или вносить изменения в его код:

1. **Клонируйте репозиторий** в любую постоянную папку на компьютере:
   ```bash
   git clone https://github.com/Alexdezton/ai-memory-mcp.git
   ```
2. **Установите зависимости:**
   ```bash
   cd ai-memory-mcp && npm install
   ```
   *(Примечание: Сервер написан на чистом JavaScript ESM, компиляция не требуется!)*
3. **Зарегистрируйте сервер** в файле настроек IDE, указав абсолютный путь к `build/index.js`:
   ```json
   "ai-memory-mcp": {
     "command": "node",
     "args": ["/absolute/path/to/ai-memory-mcp/build/index.js"]
   }
   ```

---

### Протокол обновления MCP и правил памяти

##### 1. Обновление кода сервера
* **При запуске через Вариант А (NPX):** Действий не требуется! При выходе новой версии на GitHub (с увеличенным номером версии в `package.json`), `npx` автоматически загрузит изменения с репозитория при следующем запуске IDE.
* **При запуске через Вариант Б (Локальный клон):** Просто перейдите в папку клона и скачайте изменения:
  ```bash
  git pull
  ```
  *(Команда сборки/компиляции не требуется!)*

##### 2. Динамические переменные и защита пользовательских настроек
* **Динамическая инжекция правил:** Все системные правила подгружаются автоматически из файла `system_variables.json` дистрибутива MCP-сервера. При вызове лоадера или инициализации эти правила динамически встраиваются в локальные файлы через плейсхолдеры `{SYSTEM_...}` и маркеры границ (`<!-- SYSTEM_..._START -->`).
* **Защита от перезаписи настроек пользователя:** Любые кастомные правила пользователя, записанные внутри блока `<!-- USER SECTION START -->`, полностью защищены и никогда не затираются сервером при обновлениях.
* **Резервное копирование (Backups):** Перед каждым обновлением структуры или шаблонов сервер автоматически сохраняет полную копию папки памяти во временной папке операционной системы (Windows Temp: `os.tmpdir()/ai_memory_backup_*`). В случае сбоя вы всегда сможете восстановить свои данные оттуда.

