#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const DEFAULT_CONFIG = {
  max_code_lines: 1000,
  max_agent_md_lines: 600,
  disallow_root_source_files: true,
  allowed_memory_root_files: [
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
};

/**
 * Helper to find the project root dynamically by searching upwards for AI_Memory / AI_MEMORY
 */
function findProjectRoot(startPath) {
  let currentDir = startPath ? path.resolve(startPath) : process.cwd();
  
  try {
    if (fs.existsSync(currentDir) && !fs.statSync(currentDir).isDirectory()) {
      currentDir = path.dirname(currentDir);
    }
  } catch (e) {
    currentDir = path.dirname(currentDir);
  }

  while (true) {
    const aiMemoryPath1 = path.join(currentDir, "AI_Memory");
    const aiMemoryPath2 = path.join(currentDir, "AI_MEMORY");
    if (fs.existsSync(aiMemoryPath1) || fs.existsSync(aiMemoryPath2)) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startPath ? path.resolve(startPath) : process.cwd();
    }
    currentDir = parentDir;
  }
}

/**
 * Helper to find the actual case-sensitive path to the memory directory
 */
function getMemoryDirPath(projectRoot) {
  const aiMemoryPath1 = path.join(projectRoot, "AI_Memory");
  const aiMemoryPath2 = path.join(projectRoot, "AI_MEMORY");
  if (fs.existsSync(aiMemoryPath2)) {
    return aiMemoryPath2;
  }
  if (fs.existsSync(aiMemoryPath1)) {
    return aiMemoryPath1;
  }
  return aiMemoryPath2; // default
}

/**
 * Load project configuration
 */
function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot, "mcp_ai_memory_config.json");
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(content);
      return {
        max_code_lines: userConfig.max_code_lines ?? DEFAULT_CONFIG.max_code_lines,
        max_agent_md_lines: userConfig.max_agent_md_lines ?? userConfig.max_memory_md_lines ?? DEFAULT_CONFIG.max_agent_md_lines,
        disallow_root_source_files: userConfig.disallow_root_source_files ?? DEFAULT_CONFIG.disallow_root_source_files,
        allowed_memory_root_files: userConfig.allowed_memory_root_files ?? DEFAULT_CONFIG.allowed_memory_root_files,
      };
    } catch (e) {
      // Fallback on JSON parse error
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * Helper to recursively scan the workspace and check file size limits.
 * Excludes служебные папки (.git, .vscode, node_modules, dist, build, temp-ai-memory-mcp).
 */
function checkWorkspaceLimits(projectRoot) {
  const config = loadConfig(projectRoot);
  const memoryDir = getMemoryDirPath(projectRoot);

  const ignoredFolders = [".git", ".vscode", ".agents", "node_modules", "dist", "build", "temp-ai-memory-mcp"];
  const textExtensions = [".css", ".html", ".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".txt", ".py", ".go", ".java", ".cpp", ".c", ".h", ".cs", ".sh", ".yml", ".yaml", ".env"];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }

      if (stats.isDirectory()) {
        const dirName = path.basename(fullPath);
        if (ignoredFolders.includes(dirName)) {
          continue;
        }
        scanDir(fullPath);
      } else if (stats.isFile()) {
        const relativePath = path.relative(projectRoot, fullPath);
        const filename = path.basename(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        
        // Skip configs, locks, gitignores, backup files
        if (
          filename === "mcp_ai_memory_config.json" ||
          filename === "package-lock.json" ||
          filename === "yarn.lock" ||
          filename === ".gitignore" ||
          filename.endsWith(".limit_exceeded_backup") ||
          !textExtensions.includes(ext)
        ) {
          continue;
        }

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const lineCount = content.split(/\r?\n/).length;

          const relativeToMemory = path.relative(memoryDir, fullPath);
          const isInsideMemory = !relativeToMemory.startsWith("..") && !path.isAbsolute(relativeToMemory);
          const currentFilename = filename.toLowerCase();

          if (isInsideMemory) {
            // Memory files have no limits, EXCEPT for agent.md
            if (currentFilename === "agent.md" && lineCount > config.max_agent_md_lines) {
              const ruleLink = `[core_rules.md](file:///${path.join(memoryDir, "core_rules.md").replace(/\\/g, "/")})`;
              throw new Error(`LIMIT_EXCEEDED: Файл "${relativePath}" содержит ${lineCount} строк, что превышает лимит в ${config.max_agent_md_lines} строк.
Заданный лимит для agent.md — прямое указание держать оперативную память агента краткой и структурированной.
Подробнее о стандартах читайте в правилах: ${ruleLink}`);
            }
          } else {
            if (lineCount > config.max_code_lines) {
              const ruleLink = `[core_rules.md](file:///${path.join(memoryDir, "core_rules.md").replace(/\\/g, "/")}#L170)`;
              throw new Error(`LIMIT_EXCEEDED: Файл "${relativePath}" содержит ${lineCount} строк, что превышает жесткий лимит в ${config.max_code_lines} строк.
Заданный лимит — прямое указание писать код модульно и разделять логику на подключаемые файлы.
Подробнее о стандартах и культуре написания кода читайте в правилах: ${ruleLink}`);
            }
          }
        } catch (readErr) {
          if (readErr instanceof Error && readErr.message.startsWith("LIMIT_EXCEEDED")) {
            throw readErr;
          }
        }
      }
    }
  }

  scanDir(projectRoot);
}

/**
 * ETAP 1: Инициализация проекта и рефакторинг папок
 */
function initProjectMemory(projectRoot) {
  const memoryDir = getMemoryDirPath(projectRoot);
  const templatesDir = path.resolve(__dirname, "..", "templates");

  // Helper to copy directory recursively
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      for (const file of files) {
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    } else {
      // Only copy if file doesn't exist in target to avoid overwriting user edits
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
  }

  let copyLog = "";
  if (fs.existsSync(templatesDir)) {
    try {
      copyRecursive(templatesDir, projectRoot);
      copyLog += "Базовые шаблоны AI_Memory успешно скопированы из дистрибутива MCP-сервера в проект.\n";
    } catch (e) {
      copyLog += `Ошибка копирования шаблонов: ${e.message}\n`;
    }
  } else {
    copyLog += `Предупреждение: Папка шаблонов ${templatesDir} не найдена в дистрибутиве сервера.\n`;
  }

  // Ensure the subfolders exist
  const tasksDir = path.join(memoryDir, "tasks");
  const guidelinesDir = path.join(memoryDir, "ai_agent_guidelines");
  const brainstormDir = path.join(memoryDir, "brainstorm");
  const otherDir = path.join(memoryDir, "other");
  const specificationsDir = path.join(memoryDir, "specifications");
  
  if (!fs.existsSync(tasksDir)) fs.mkdirSync(tasksDir, { recursive: true });
  if (!fs.existsSync(guidelinesDir)) fs.mkdirSync(guidelinesDir, { recursive: true });
  if (!fs.existsSync(brainstormDir)) fs.mkdirSync(brainstormDir, { recursive: true });
  if (!fs.existsSync(otherDir)) fs.mkdirSync(otherDir, { recursive: true });
  if (!fs.existsSync(specificationsDir)) fs.mkdirSync(specificationsDir, { recursive: true });

  const moves = [
    {
      from: path.join(memoryDir, "agent.md"),
      to: path.join(projectRoot, "agent.md")
    },
    {
      from: path.join(memoryDir, "AGENT_DISCIPLINE.md"),
      to: path.join(guidelinesDir, "AGENT_DISCIPLINE.md")
    },
    {
      from: path.join(memoryDir, "tasks.md"),
      to: path.join(tasksDir, "tasks.md")
    },
    {
      from: path.join(memoryDir, "decisions.md"),
      to: path.join(otherDir, "decisions.md")
    }
  ];

  let movedLog = "";
  for (const m of moves) {
    if (fs.existsSync(m.from)) {
      try {
        fs.renameSync(m.from, m.to);
        movedLog += `Перемещен ${path.basename(m.from)} -> ${path.relative(projectRoot, m.to)}\n`;
      } catch (err) {
        try {
          fs.copyFileSync(m.from, m.to);
          fs.unlinkSync(m.from);
          movedLog += `Перемещен (copy+del) ${path.basename(m.from)} -> ${path.relative(projectRoot, m.to)}\n`;
        } catch (e) {
          movedLog += `Ошибка перемещения ${path.basename(m.from)}: ${e.message}\n`;
        }
      }
    }
  }

  // Create config file if not exists
  const configPath = path.join(projectRoot, "mcp_ai_memory_config.json");
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    movedLog += `Создан mcp_ai_memory_config.json в корне проекта\n`;
  }

  return `Инициализация памяти завершена.\n${copyLog}${movedLog}`;
}

/**
 * ETAP 4: verify_write(filepath)
 */
function verifyWrite(projectRoot, filepath) {
  const config = loadConfig(projectRoot);
  const memoryDir = getMemoryDirPath(projectRoot);
  const resolvedPath = path.isAbsolute(filepath) ? filepath : path.resolve(projectRoot, filepath);
  const relativeToProject = path.relative(projectRoot, resolvedPath);
  const relativeToMemory = path.relative(memoryDir, resolvedPath);
  const isInsideMemory = !relativeToMemory.startsWith("..") && !path.isAbsolute(relativeToMemory);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`FILE_NOT_FOUND: Файл ${relativeToProject} не найден на диске. Перед вызовом verify_write вы обязаны записать файл с помощью нативного инструмента write_to_file.`);
  }

  // Read file content
  const content = fs.readFileSync(resolvedPath, "utf-8");
  const lineCount = content.split(/\r?\n/).length;

  // Blocker: check if global plan is missing/empty
  const planPath = path.join(memoryDir, "tasks", "project_launch_plan.md");
  const relativeToPlan = path.relative(planPath, resolvedPath);
  const isWritingPlan = relativeToPlan === "";

  let isPlanMissingOrEmpty = true;
  if (fs.existsSync(planPath)) {
    const planContent = fs.readFileSync(planPath, "utf-8").trim();
    if (planContent.length > 0) {
      isPlanMissingOrEmpty = false;
    }
  }

  if (isPlanMissingOrEmpty && !isWritingPlan && !isInsideMemory) {
    throw new Error(`PLAN_MISSING: Глобальный план запуска (${path.relative(projectRoot, planPath)}) отсутствует или пуст. Вы обязаны остановиться и задать пользователю вопросы о том, как запустить проект, чтобы сформировать этот план.`);
  }

  // Check memory root write protection
  if (isInsideMemory) {
    const memoryRootFiles = config.allowed_memory_root_files;
    const parentDir = path.dirname(resolvedPath);
    if (parentDir === memoryDir) {
      const filename = path.basename(resolvedPath);
      if (!memoryRootFiles.includes(filename)) {
        throw new Error(`FATAL: В корне AI_Memory запрещено создавать новые файлы. Сохрани в подпапку или спроси пользователя куда он считает правильным поместить новый файл или папку`);
      }
    }
  }

  // Check root source files restriction
  const parentDir = path.dirname(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const baseFilename = path.basename(resolvedPath);
  const isSourceFile = [".css", ".js", ".ts", ".tsx", ".jsx", ".scss", ".sass", ".less"].includes(ext);

  if (config.disallow_root_source_files && parentDir === projectRoot && isSourceFile) {
    const rulesLink = `[PROJECT_STRUCTURE.md](file:///${path.join(memoryDir, "ai_agent_guidelines", "PROJECT_STRUCTURE.md").replace(/\\/g, "/")})`;
    throw new Error(`ROOT_SOURCE_FORBIDDEN: Файлы исходного кода (${baseFilename}) не должны находиться прямо в корне проекта.
Пожалуйста, перенесите файл в соответствующую подпапку (например, css/, js/ или src/).
Подробнее о стандартах структуры папок читайте в регламенте: ${rulesLink}`);
  }

  // Check limits
  const filename = path.basename(resolvedPath).toLowerCase();
  if (isInsideMemory) {
    // Memory files have no limits, EXCEPT for agent.md
    if (filename === "agent.md" && lineCount > config.max_agent_md_lines) {
      const ruleLink = `[core_rules.md](file:///${path.join(memoryDir, "core_rules.md").replace(/\\/g, "/")})`;
      throw new Error(`LIMIT_EXCEEDED: Файл "${relativeToProject}" содержит ${lineCount} строк, что превышает лимит в ${config.max_agent_md_lines} строк.
Заданный лимит для agent.md — прямое указание держать оперативную память агента краткой и структурированной.
Подробнее о стандартах читайте в правилах: ${ruleLink}`);
    }
  } else {
    if (lineCount > config.max_code_lines) {
      const ruleLink = `[core_rules.md](file:///${path.join(memoryDir, "core_rules.md").replace(/\\/g, "/")}#L170)`;
      throw new Error(`LIMIT_EXCEEDED: Файл "${relativeToProject}" содержит ${lineCount} строк, что превышает установленный лимит в ${config.max_code_lines} строк.
Заданный лимит — прямое указание писать код модульно и разделять логику на подключаемые файлы.
Подробнее о стандартах и культуре написания кода читайте в правилах: ${ruleLink}`);
    }
  }

  return `Файл ${relativeToProject} успешно верифицирован. Лимиты и правила соблюдены.`;
}

/**
 * Helper to log MCP actions automatically to AI_MEMORY/mcp_history.log.
 * Consumes zero LLM tokens and runs synchronously.
 */
function logMcpAction(
  projectRoot,
  toolName,
  args,
  status,
  details
) {
  try {
    const memoryDir = getMemoryDirPath(projectRoot);
    if (!fs.existsSync(memoryDir)) return; // Memory not initialized yet

    const logPath = path.join(memoryDir, "mcp_history.log");
    const timestamp = new Date().toISOString();
    const argsStr = JSON.stringify(args || {});
    const cleanDetails = details ? details.replace(/\r?\n/g, " ") : "";
    const logLine = `[${timestamp}] TOOL: ${toolName} | ARGS: ${argsStr} | STATUS: ${status}${cleanDetails ? ` | DETAILS: ${cleanDetails}` : ""}\n`;

    fs.appendFileSync(logPath, logLine, "utf-8");
  } catch (err) {
    // Fail silently to avoid breaking tool execution
  }
}

/**
 * add_log_entry(filepath, content, mode)
 */
function addLogEntry(projectRoot, filepath, content, mode) {
  const resolvedPath = path.isAbsolute(filepath) ? filepath : path.resolve(projectRoot, filepath);
  
  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, content, "utf-8");
    return `Создан новый файл лога и записана запись в ${path.relative(projectRoot, resolvedPath)}`;
  }

  const existingContent = fs.readFileSync(resolvedPath, "utf-8");

  if (mode === "prepend") {
    // Find header: either first line starting with # and separator ---, or just first line starting with #
    let insertIndex = 0;
    const headerMatchWithSeparator = existingContent.match(/^#[^\n]*\r?\n---/m);
    
    if (headerMatchWithSeparator && headerMatchWithSeparator.index !== undefined) {
      insertIndex = headerMatchWithSeparator.index + headerMatchWithSeparator[0].length;
    } else {
      const headerMatch = existingContent.match(/^#[^\n]*/m);
      if (headerMatch && headerMatch.index !== undefined) {
        insertIndex = headerMatch.index + headerMatch[0].length;
      }
    }

    const before = existingContent.slice(0, insertIndex);
    const after = existingContent.slice(insertIndex);
    
    const leadingNewline = before.endsWith("\n") ? "" : "\n";
    const middleNewlines = "\n\n";
    const trailingNewline = after.startsWith("\n") ? "" : "\n";

    const newContent = before + leadingNewline + content.trim() + middleNewlines + after.trimStart() + trailingNewline;
    fs.writeFileSync(resolvedPath, newContent, "utf-8");
    return `Запись успешно вставлена в начало (после заголовка) файла ${path.relative(projectRoot, resolvedPath)}`;
  } else {
    const leadingNewline = existingContent.endsWith("\n") ? "" : "\n";
    const newContent = existingContent + leadingNewline + content.trim() + "\n";
    fs.writeFileSync(resolvedPath, newContent, "utf-8");
    return `Запись успешно добавлена в конец файла ${path.relative(projectRoot, resolvedPath)}`;
  }
}

/**
 * Helper to find task line index in tasks.md by its exact ID
 */
function findTaskLineIndex(lines, taskId) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)-\s*\[([ x\~])\]\s*(.*?)$/);
    if (match) {
      const indent = match[1].length;
      const textAfterCheckbox = match[3].trim();
      if (
        textAfterCheckbox === taskId ||
        textAfterCheckbox.startsWith(`${taskId}:`) ||
        textAfterCheckbox.startsWith(`${taskId} `) ||
        textAfterCheckbox.startsWith(`${taskId}\t`) ||
        textAfterCheckbox.startsWith(`${taskId}|`)
      ) {
        return { index: i, indent };
      }
    }
  }
  return { index: -1, indent: 0 };
}

/**
 * manage_task_tree(action, task_id, parent_id, title, status)
 */
function manageTaskTree(
  projectRoot,
  action,
  taskId,
  parentId,
  title,
  status
) {
  const memoryDir = getMemoryDirPath(projectRoot);
  let tasksPath = path.join(memoryDir, "tasks", "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    tasksPath = path.join(memoryDir, "tasks.md");
  }

  if (!fs.existsSync(tasksPath)) {
    throw new Error(`Файл задач не найден. Пожалуйста, выполните инициализацию init_project_memory.`);
  }

  const fileContent = fs.readFileSync(tasksPath, "utf-8");
  const lines = fileContent.split(/\r?\n/);

  if (action === "create_branch") {
    const stageTitle = title || taskId;
    const newHeading = `\n## ${stageTitle}`;
    lines.push(newHeading);
    fs.writeFileSync(tasksPath, lines.join("\n"), "utf-8");
    return `Создана ветка этапа: ${stageTitle}`;
  }

  if (action === "add_subtask") {
    let cb = "[ ]";
    if (status === "in_progress" || status === "Review") cb = "[~]";
    if (status === "completed" || status === "Done") cb = "[x]";

    // Ensure the line contains the taskId so it can be searched for later
    const subtaskTitle = title ? `${taskId}: ${title}` : taskId;
    const taskLineText = `${cb} ${subtaskTitle}`;

    if (parentId) {
      const { index: parentIndex, indent: parentIndent } = findTaskLineIndex(lines, parentId);

      if (parentIndex === -1) {
        throw new Error(`Родительская задача ${parentId} не найдена.`);
      }

      // Find last child line or section boundary to insert after
      let insertIndex = parentIndex + 1;
      while (insertIndex < lines.length) {
        const line = lines[insertIndex];
        if (line.trim() === "") {
          insertIndex++;
          continue;
        }
        if (line.startsWith("#") || line.trim() === "---") {
          break;
        }
        const match = line.match(/^(\s*)-/);
        if (match) {
          const indent = match[1].length;
          if (indent <= parentIndent) {
            break;
          }
        } else {
          // Non-list line
          break;
        }
        insertIndex++;
      }

      const childIndent = parentIndent + 2;
      const childLine = `${" ".repeat(childIndent)}- ${taskLineText}`;
      lines.splice(insertIndex, 0, childLine);
      fs.writeFileSync(tasksPath, lines.join("\n"), "utf-8");
      return `Добавлена подзадача "${subtaskTitle}" к родителю "${parentId}"`;
    } else {
      const defaultLine = `- ${taskLineText}`;
      lines.push(defaultLine);
      fs.writeFileSync(tasksPath, lines.join("\n"), "utf-8");
      return `Добавлена корневая задача "${subtaskTitle}"`;
    }
  }

  if (action === "close_task") {
    const { index: taskIndex, indent: taskIndent } = findTaskLineIndex(lines, taskId);

    if (taskIndex === -1) {
      throw new Error(`Задача ${taskId} не найдена.`);
    }

    // Verify subtasks
    let subtasksAreCompleted = true;
    let scanIndex = taskIndex + 1;
    while (scanIndex < lines.length) {
      const line = lines[scanIndex];
      if (line.trim() === "") {
        scanIndex++;
        continue;
      }
      if (line.startsWith("#") || line.trim() === "---") {
        break;
      }
      const match = line.match(/^(\s*)-/);
      if (match) {
        const indent = match[1].length;
        if (indent <= taskIndent) {
          break;
        }
        if (line.includes("- [ ]") || line.includes("- [~]")) {
          subtasksAreCompleted = false;
          break;
        }
      } else {
        break;
      }
      scanIndex++;
    }

    if (!subtasksAreCompleted) {
      throw new Error(`Невозможно закрыть задачу "${taskId}", так как её подзадачи не выполнены.`);
    }

    const originalLine = lines[taskIndex];
    let updatedLine = originalLine.replace(/-\s*\[[ \~]\]/, "- [x]");
    if (updatedLine === originalLine) {
      updatedLine = originalLine.replace(/\[[ \~]\]/, "[x]");
    }
    lines[taskIndex] = updatedLine;
    fs.writeFileSync(tasksPath, lines.join("\n"), "utf-8");
    return `Задача "${taskId}" успешно закрыта`;
  }

  throw new Error(`Неизвестное действие: ${action}`);
}

/**
 * sync_project_state(component, description)
 */
function syncProjectState(projectRoot, component, description) {
  const memoryDir = getMemoryDirPath(projectRoot);
  const archPath = path.join(memoryDir, "architecture_map.md");

  if (!fs.existsSync(archPath)) {
    throw new Error(`architecture_map.md не найден в корне памяти.`);
  }

  let fileContent = fs.readFileSync(archPath, "utf-8");
  let lines = fileContent.split(/\r?\n/);

  let compSectionStart = -1;
  let compSectionEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("## 1. Компоненты системы")) {
      compSectionStart = i;
    }
    if (compSectionStart !== -1 && i > compSectionStart) {
      if (line.startsWith("## ") || line.trim() === "---") {
        compSectionEnd = i;
        break;
      }
    }
  }

  if (compSectionStart === -1) {
    throw new Error(`Секция "## 1. Компоненты системы" не найдена в architecture_map.md`);
  }
  if (compSectionEnd === -1) {
    compSectionEnd = lines.length;
  }

  let componentIndex = -1;
  const compHeaderPattern1 = `### ${component}`;
  const compHeaderPattern2 = `### [${component}]`;

  for (let i = compSectionStart; i < compSectionEnd; i++) {
    const line = lines[i];
    if (line.trim() === compHeaderPattern1 || line.trim() === compHeaderPattern2) {
      componentIndex = i;
      break;
    }
  }

  if (componentIndex !== -1) {
    let detailsEnd = componentIndex + 1;
    while (detailsEnd < compSectionEnd) {
      const line = lines[detailsEnd];
      if (line.startsWith("###") || line.startsWith("##") || line.trim() === "---") {
        break;
      }
      detailsEnd++;
    }

    const newDetails = description.split(/\r?\n/);
    lines.splice(componentIndex + 1, detailsEnd - (componentIndex + 1), ...newDetails);
  } else {
    const newCompLines = [
      "",
      `### ${component}`,
      ...description.split(/\r?\n/)
    ];
    lines.splice(compSectionEnd, 0, ...newCompLines);
  }

  // Update timestamps
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  
  lines = lines.map(line => {
    if (line.startsWith("**Last Updated:**") || line.startsWith("**Последнее обновление:**")) {
      return `**Last Updated:** ${dateStr}  `;
    }
    if (line.startsWith("*Last Updated:*") || line.startsWith("*Последнее обновление:*")) {
      return `*Последнее обновление: ${dateStr}*`;
    }
    return line;
  });

  fs.writeFileSync(archPath, lines.join("\n"), "utf-8");
  return `Архитектура синхронизирована для компонента: ${component}`;
}

/**
 * log_brainstorm(topic, decisions_summary)
 */
function logBrainstorm(projectRoot, topic, decisionsSummary) {
  const memoryDir = getMemoryDirPath(projectRoot);
  const brainstormDir = path.join(memoryDir, "brainstorm");

  if (!fs.existsSync(brainstormDir)) {
    fs.mkdirSync(brainstormDir, { recursive: true });
  }

  const files = fs.readdirSync(brainstormDir);
  let maxIndex = 0;
  for (const file of files) {
    const match = file.match(/^(\d+)_(.*)\.md$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) {
        maxIndex = idx;
      }
    }
  }

  const nextIndex = String(maxIndex + 1).padStart(2, '0');
  const sanitizedTopic = topic
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();

  const fileName = `${nextIndex}_${sanitizedTopic || "discussion"}.md`;
  const filePath = path.join(brainstormDir, fileName);

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  const brainstormContent = `# ${topic}

**Дата:** ${dateStr}

**ВАЖНО:** Это архив мозгового штурма. Актуальная информация о работе приложения находится в основных файлах AI_MEMORY. Содержимое этого файла могло устареть по ходу разработки.

## Проблема

[Автоматически зафиксированное обсуждение по теме: ${topic}]

## Обсуждение и Принятое решение

${decisionsSummary}

## Действия (TODO)

- [ ] Запланировать шаги реализации на основе этого обсуждения
`;

  fs.writeFileSync(filePath, brainstormContent, "utf-8");
  return `Создан протокол обсуждения: ${path.relative(projectRoot, filePath)}`;
}

/**
 * cleanup_workspace(files_to_delete)
 */
function cleanupWorkspace(projectRoot, filesToDelete) {
  let log = "";
  for (const file of filesToDelete) {
    const resolvedPath = path.isAbsolute(file) ? file : path.resolve(projectRoot, file);
    const relative = path.relative(projectRoot, resolvedPath);
    const isInsideProject = !relative.startsWith("..") && !path.isAbsolute(relative);
    
    if (!isInsideProject) {
      log += `Пропущен (вне проекта): ${file}\n`;
      continue;
    }

    if (fs.existsSync(resolvedPath)) {
      try {
        const stats = fs.statSync(resolvedPath);
        if (stats.isDirectory()) {
          fs.rmSync(resolvedPath, { recursive: true, force: true });
          log += `Удалена папка: ${relative}\n`;
        } else {
          fs.unlinkSync(resolvedPath);
          log += `Удален файл: ${relative}\n`;
        }
      } catch (err) {
        log += `Ошибка удаления ${relative}: ${err.message}\n`;
      }
    } else {
      log += `Файл не найден: ${relative}\n`;
    }
  }
  return log || "Нет переданных файлов для удаления.";
}

/**
 * execute_loader(user_time)
 */
function executeLoader(projectRoot, userTime) {
  const memoryDir = getMemoryDirPath(projectRoot);
  
  // 1. Read core_rules.md for PROJECT_STATE
  let projectState = "development";
  const coreRulesPath = path.join(memoryDir, "core_rules.md");
  if (fs.existsSync(coreRulesPath)) {
    const content = fs.readFileSync(coreRulesPath, "utf-8");
    const match = content.match(/PROJECT_STATE:\s*\*?\[?(\w+)\]?\*?/i);
    if (match) {
      projectState = match[1].trim();
    }
  }

  // 2. Read tasks.md for ACTIVE_TASK, NEXT_STEP, BLOCKERS
  let tasksPath = path.join(memoryDir, "tasks", "tasks.md");
  if (!fs.existsSync(tasksPath)) {
    tasksPath = path.join(memoryDir, "tasks.md");
  }

  let activeTask = "None";
  let nextStep = "None";
  let blockers = "None";

  if (fs.existsSync(tasksPath)) {
    const content = fs.readFileSync(tasksPath, "utf-8");
    const activeTaskMatch = content.match(/\*\*ACTIVE_TASK:\*\*\s*(.*)/i);
    const nextStepMatch = content.match(/\*\*NEXT_STEP:\*\*\s*(.*)/i);
    const blockersMatch = content.match(/\*\*BLOCKERS:\*\*\s*(.*)/i);

    if (activeTaskMatch) activeTask = activeTaskMatch[1].trim();
    if (nextStepMatch) nextStep = nextStepMatch[1].trim();
    if (blockersMatch) blockers = blockersMatch[1].trim();
  }

  // Fallback to checkpoint-latest.json if markdown values are placeholders
  const checkpointPath = path.join(memoryDir, "checkpoint-latest.json");
  if (fs.existsSync(checkpointPath)) {
    try {
      const jsonContent = fs.readFileSync(checkpointPath, "utf-8");
      const checkpoint = JSON.parse(jsonContent);
      if (activeTask === "None" || activeTask === "" || activeTask.includes("[ID]")) {
        if (checkpoint.active_task) activeTask = checkpoint.active_task;
      }
      if (nextStep === "None" || nextStep === "" || nextStep.includes("[Конкретный следующий шаг]")) {
        if (checkpoint.next_step) nextStep = checkpoint.next_step;
      }
      if (blockers === "None" || blockers === "" || blockers.includes("[Блокеры")) {
        if (checkpoint.blockers && checkpoint.blockers.length > 0) {
          blockers = checkpoint.blockers.join(", ");
        } else {
          blockers = "None";
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // 3. Update LAST_LOADER.json
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  const lastLoaderPath = path.join(memoryDir, "LAST_LOADER.json");
  
  const lastLoaderData = {
    timestamp: `${userTime}, ${dateStr}`
  };
  fs.writeFileSync(lastLoaderPath, JSON.stringify(lastLoaderData, null, 4), "utf-8");

  return `AI_MEMORY LOADED. ACTIVE_TASK: ${activeTask}, NEXT_STEP: ${nextStep}, BLOCKERS: ${blockers}, PROJECT_STATE: ${projectState}\n\n[IMPORTANT] Агент ОБЯЗАН прочитать файлы правил в AI_MEMORY (особенно core_rules.md) перед внесением любых изменений!`;
}

/**
 * execute_eos()
 */
async function executeEos(projectRoot) {
  const memoryDir = getMemoryDirPath(projectRoot);
  const checkpointPath = path.join(memoryDir, "checkpoint-latest.json");
  
  let checkpoint = {};
  let sinceTimestamp = "";

  if (fs.existsSync(checkpointPath)) {
    try {
      const content = fs.readFileSync(checkpointPath, "utf-8");
      checkpoint = JSON.parse(content);
      sinceTimestamp = checkpoint.timestamp || "";
    } catch (e) {
      // Ignore
    }
  }

  if (!sinceTimestamp) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    sinceTimestamp = yesterday.toISOString();
  }

  const command = `git log --since="${sinceTimestamp}" --name-only --oneline`;
  
  let gitOutput = "";
  try {
    const { stdout } = await execAsync(command, { cwd: projectRoot });
    gitOutput = stdout.trim();
  } catch (err) {
    gitOutput = `Ошибка выполнения команды git log (возможно, папка не является репозиторием): ${err.message}`;
  }

  const now = new Date();
  checkpoint.timestamp = now.toISOString();
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), "utf-8");

  return `С прошлого чекпоинта изменены файлы и коммиты:\n${gitOutput || "Изменений в git не обнаружено."}\n\nПожалуйста, напишите summary для сессии.`;
}

/**
 * Start the MCP Server
 */
const server = new Server(
  {
    name: "ai-memory-mcp",
    version: "0.1.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "init_project_memory",
        description: "Инициализация структуры AI_Memory и создание конфигурационного файла mcp_ai_memory_config.json в корне проекта.",
        inputSchema: {
          type: "object",
          properties: {
            project_root: {
              type: "string",
              description: "Абсолютный путь к корню проекта (если отличается от текущей рабочей директории процесса)"
            }
          }
        }
      },
      {
        name: "verify_write",
        description: "Верификация записанного файла на соответствие лимитам строк и правилам проектной памяти (No Plan Blocker). Вызывается сразу после нативной записи write_to_file.",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Абсолютный путь к файлу или относительный путь от корня проекта"
            }
          },
          required: ["filepath"]
        }
      },
      {
        name: "add_log_entry",
        description: "Добавление записи в лог (например, session_log.md или decisions.md) без перезаписи всего файла.",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Путь к лог-файлу"
            },
            content: {
              type: "string",
              description: "Запись, которую нужно добавить"
            },
            mode: {
              type: "string",
              enum: ["prepend", "append"],
              description: "Режим добавления (prepend - сразу под заголовком, append - в конец)"
            }
          },
          required: ["filepath", "content", "mode"]
        }
      },
      {
        name: "manage_task_tree",
        description: "Управление деревом задач в Markdown-файле AI_Memory/tasks/tasks.md.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create_branch", "add_subtask", "close_task"],
              description: "Действие с задачами"
            },
            task_id: {
              type: "string",
              description: "Идентификатор задачи или этапа"
            },
            parent_id: {
              type: "string",
              description: "Идентификатор родительской задачи (для subtask)"
            },
            title: {
              type: "string",
              description: "Заголовок этапа или задачи"
            },
            status: {
              type: "string",
              enum: ["todo", "in_progress", "completed"],
              description: "Статус задачи"
            }
          },
          required: ["action", "task_id"]
        }
      },
      {
        name: "sync_project_state",
        description: "Синхронизация карты архитектуры в architecture_map.md при изменении или добавлении компонентов.",
        inputSchema: {
          type: "object",
          properties: {
            component: {
              type: "string",
              description: "Название компонента"
            },
            description: {
              type: "string",
              description: "Новое описание или характеристики компонента в Markdown"
            }
          },
          required: ["component", "description"]
        }
      },
      {
        name: "log_brainstorm",
        description: "Создание стандартизированного протокола обсуждения (мозгового штурма) в папке brainstorm/.",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "Тема обсуждения"
            },
            decisions_summary: {
              type: "string",
              description: "Резюме обсуждения, варианты и принятые решения"
            }
          },
          required: ["topic", "decisions_summary"]
        }
      },
      {
        name: "cleanup_workspace",
        description: "Уборка рабочего пространства от временных, мусорных или тестовых файлов.",
        inputSchema: {
          type: "object",
          properties: {
            files_to_delete: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Список путей к файлам для удаления"
            }
          },
          required: ["files_to_delete"]
        }
      },
      {
        name: "execute_loader",
        description: "Быстрая загрузка сессии. Считывает статус проекта и задач, регистрирует время.",
        inputSchema: {
          type: "object",
          properties: {
            user_time: {
              type: "string",
              description: "Время старта сессии (например, 4:30 pm)"
            },
            project_root: {
              type: "string",
              description: "Абсолютный путь к корню проекта (если отличается от текущей рабочей директории процесса)"
            }
          },
          required: ["user_time"]
        }
      },
      {
        name: "execute_eos",
        description: "Сбор коммитов и изменений с момента прошлого чекпоинта и подготовка к завершению сессии.",
        inputSchema: {
          type: "object",
          properties: {
            project_root: {
              type: "string",
              description: "Абсолютный путь к корню проекта (если отличается от текущей рабочей директории процесса)"
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const explicitRoot = request.params.arguments?.project_root ? String(request.params.arguments.project_root) : undefined;
  const filepathArg = request.params.arguments?.filepath ? String(request.params.arguments.filepath) : undefined;
  const projectRoot = findProjectRoot(explicitRoot || filepathArg);
  
  try {
    if (request.params.name !== "init_project_memory") {
      checkWorkspaceLimits(projectRoot);
    }
  } catch (limitErr) {
    logMcpAction(projectRoot, request.params.name, request.params.arguments, "ERROR", limitErr.message);
    throw limitErr;
  }
  
  try {
    let resultText = "";
    let response;
    
    switch (request.params.name) {
      case "init_project_memory": {
        const result = initProjectMemory(projectRoot);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "verify_write": {
        const filepath = String(request.params.arguments?.filepath);
        const result = verifyWrite(projectRoot, filepath);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "add_log_entry": {
        const filepath = String(request.params.arguments?.filepath);
        const content = String(request.params.arguments?.content);
        const mode = request.params.arguments?.mode;
        const result = addLogEntry(projectRoot, filepath, content, mode);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "manage_task_tree": {
        const action = request.params.arguments?.action;
        const taskId = String(request.params.arguments?.task_id);
        const parentId = request.params.arguments?.parent_id ? String(request.params.arguments?.parent_id) : undefined;
        const title = request.params.arguments?.title ? String(request.params.arguments?.title) : undefined;
        const status = request.params.arguments?.status ? String(request.params.arguments?.status) : undefined;
        
        const result = manageTaskTree(projectRoot, action, taskId, parentId, title, status);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "sync_project_state": {
        const component = String(request.params.arguments?.component);
        const description = String(request.params.arguments?.description);
        const result = syncProjectState(projectRoot, component, description);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "log_brainstorm": {
        const topic = String(request.params.arguments?.topic);
        const decisionsSummary = String(request.params.arguments?.decisions_summary);
        const result = logBrainstorm(projectRoot, topic, decisionsSummary);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "cleanup_workspace": {
        const filesToDelete = request.params.arguments?.files_to_delete;
        const result = cleanupWorkspace(projectRoot, filesToDelete);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "execute_loader": {
        const userTime = String(request.params.arguments?.user_time);
        const result = executeLoader(projectRoot, userTime);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      case "execute_eos": {
        const result = await executeEos(projectRoot);
        resultText = result;
        response = { content: [{ type: "text", text: result }] };
        break;
      }

      default:
        throw new Error(`Неизвестный инструмент: ${request.params.name}`);
    }
    
    logMcpAction(projectRoot, request.params.name, request.params.arguments, "SUCCESS", resultText);
    return response;
  } catch (err) {
    logMcpAction(projectRoot, request.params.name, request.params.arguments, "ERROR", err.message);
    throw err;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Критическая ошибка сервера:", error);
  process.exit(1);
});
