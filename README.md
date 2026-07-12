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

---

### Installation

> [!WARNING]
> **DO NOT** run the server command manually in your terminal (e.g., executing `node build/index.js` as a standalone command line).
> Running it directly starts the stdio server transport which runs in an infinite loop waiting for IDE requests, causing your terminal and agent session to **deadlock/freeze**.
> You only need to register the command inside your IDE's MCP settings or configuration files. The IDE client will spawn the process automatically. To ensure stability, fast startup times, and prevent network or environment issues inside background IDE runners, **Local Installation (Option A)** is the primary and highly recommended installation method for agents.

---

### Option A: Local Installation (Recommended for Agents)

Agents should follow this automated step-by-step checklist to install the server locally in the workspace:

1. **Clone the repository** directly into the current workspace folder:
   ```bash
   git clone https://github.com/Alexdezton/ai-memory-mcp.git ai-memory-mcp
   ```
2. **Isolate the directory:** Add `ai-memory-mcp/` to the project's `.gitignore` file immediately to avoid committing the server code or node_modules to the active project repository:
   ```bash
   echo "ai-memory-mcp/" >> .gitignore
   ```
3. **Compile the server:** Navigate to the cloned folder, install dependencies, and build:
   ```bash
   cd ai-memory-mcp && npm install && npm run build
   ```
4. **Register the server globally:**
   - **Antigravity 2.0 / CLI Path:** The global configuration file is located at `~/.gemini/config/mcp_config.json` (on Windows: `%USERPROFILE%\.gemini\config\mcp_config.json`).
   - **Sandbox Restriction Bypass:** Direct filesystem write tools (like `write_to_file`) are blocked from writing to the `.gemini/config` folder due to agent sandbox rules. 
   - **Agent Protocol:** The agent **MUST** run a terminal one-liner (Node.js or PowerShell) to update the global `mcp_config.json` file securely, prompting the user for execution permission.
   
   Run this Node.js one-liner in the active workspace root directory:
   ```bash
   node -e "const fs = require('fs'); const path = require('path'); const configFile = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini/config/mcp_config.json'); fs.mkdirSync(path.dirname(configFile), { recursive: true }); const data = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : { mcpServers: {} }; data.mcpServers = data.mcpServers || {}; data.mcpServers['ai-memory-mcp'] = { command: 'node', args: [path.resolve('ai-memory-mcp/build/index.js').replace(/\\/g, '/')] }; fs.writeFileSync(configFile, JSON.stringify(data, null, 2), 'utf8');"
   ```
5. **Ask the user to refresh:**
   - **AGENTS PROTOCOL:** Immediately stop and ask the user to reload the MCP server list (Settings → MCP → Refresh) or restart the IDE session.
   - **DO NOT** invoke any server tools (such as `init_project_memory`) until the user confirms the refresh is complete. Calling tools beforehand will fail with a "not enabled" client-side error.

---

### Option B: Remote Run via GitHub (Backup / Manual)

If you wish to run the server remotely without cloning, add the server to your configuration files (Note for Windows: use `npx.cmd` instead of `npx`):

##### 1. In Antigravity (`~/.gemini/config/mcp_config.json`)
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
Add a new MCP server in Settings:
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

---

### Установка

> [!WARNING]
> **НЕ ЗАПУСКАЙТЕ** команду сервера вручную в терминале (например, выполняя `node build/index.js` в командной строке).
> Прямой запуск запускает stdio-транспорт сервера, который работает в бесконечном цикле ожидания запросов от IDE. Это приведет к **зависанию (deadlock)** вашего терминала и сессии агента.
> Вам нужно лишь зарегистрировать эту команду в настройках MCP вашей IDE или в файлах конфигурации. Клиент IDE сам запустит процесс на фоне по мере необходимости.

Для обеспечения стабильности, быстрой инициализации и предотвращения сетевых сбоев внутри фоновых процессов IDE, **Локальная установка (Вариант А)** является основным и рекомендуемым способом установки для агентов.

---

### Вариант А: Локальная установка (Рекомендуемый для Агентов)

Агенты должны следовать этому пошаговому чек-листу для автоматической локальной установки сервера в рабочей папке:

1. **Клонировать репозиторий** прямо в текущую рабочую папку:
   ```bash
   git clone https://github.com/Alexdezton/ai-memory-mcp.git ai-memory-mcp
   ```
2. **Изолировать файлы:** Немедленно добавьте строку `ai-memory-mcp/` в файл `.gitignore` текущего проекта, чтобы код сервера и папка node_modules не попали в коммиты основного репозитория:
   ```bash
   echo "ai-memory-mcp/" >> .gitignore
   ```
3. **Скомпилировать сервер:** Перейдите в папку сервера, установите зависимости и соберите проект:
   ```bash
   cd ai-memory-mcp && npm install && npm run build
   ```
4. **Зарегистрировать сервер глобально:**
   - **Путь для Antigravity 2.0 / CLI:** Глобальный файл конфигурации находится по пути `~/.gemini/config/mcp_config.json` (на Windows: `%USERPROFILE%\.gemini\config\mcp_config.json`).
   - **Обход ограничений песочницы:** Файловые инструменты агента (например, `write_to_file`) заблокированы политикой безопасности среды (sandbox) для папки `.gemini/config`.
   - **Протокол для агентов:** Агент **ОБЯЗАН** запустить Node.js-скрипт в терминале для безопасного обновления файла конфигурации (потребовав одобрения команды пользователем).
   
   Запустите следующий Node.js однострочник в корне рабочей папки:
   ```bash
   node -e "const fs = require('fs'); const path = require('path'); const configFile = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini/config/mcp_config.json'); fs.mkdirSync(path.dirname(configFile), { recursive: true }); const data = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : { mcpServers: {} }; data.mcpServers = data.mcpServers || {}; data.mcpServers['ai-memory-mcp'] = { command: 'node', args: [path.resolve('ai-memory-mcp/build/index.js').replace(/\\/g, '/')] }; fs.writeFileSync(configFile, JSON.stringify(data, null, 2), 'utf8');"
   ```
5. **Попросить пользователя обновить список:**
   - **ПРОТОКОЛ ДЛЯ АГЕНТОВ:** Немедленно остановитесь и попросите пользователя перезагрузить список MCP-серверов в IDE (Settings → MCP → Refresh) или перезапустить сессию.
   - **НЕ ПЫТАЙТЕСЬ** вызывать инструменты сервера (такие как `init_project_memory`) до подтверждения от пользователя. Это приведет к клиентской ошибке "not enabled".

---

### Вариант Б: Удаленный запуск напрямую из GitHub (Альтернативный / Вручную)

Если вы хотите запустить сервер удаленно без клонирования кода, добавьте настройки в ваши конфигурационные файлы (Примечание для Windows: используйте `npx.cmd` вместо `npx`):

##### 1. В Antigravity (`~/.gemini/config/mcp_config.json`)
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

