# TODO: Интеграция ESLint & Stylelint для контроля лимитов строк в реальном времени

В будущем для больших проектов мы можем внедрить визуальную подсветку ошибок превышения лимитов строк непосредственно в редакторе IDE (VS Code / Antigravity) с помощью стандартных линтеров. Это позволит разработчикам и агентам видеть предупреждения в реальном времени во время написания кода.

---

## 1. Шаги установки зависимостей в проект

Для работы линтеров в проекте необходимо инициализировать Node.js окружение и установить пакеты:

```bash
# Инициализация (если проект пустой)
npm init -y

# Установка ESLint (для JavaScript / TypeScript)
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Установка Stylelint (для CSS)
npm install --save-dev stylelint stylelint-config-standard
```

---

## 2. Конфигурационные файлы

### Конфигурация ESLint (`.eslintrc.json`)
Создайте файл в корне проекта:

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "max-lines": [
      "error",
      {
        "max": 1000,
        "skipBlankLines": true,
        "skipComments": true
      }
    ]
  }
}
```

### Конфигурация Stylelint (`.stylelintrc.json`)
Создайте файл в корне проекта:

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "max-line-length": null,
    "linebreaks": "unix",
    "declaration-block-single-line-max-declarations": 1,
    "color-hex-length": "short"
  }
}
```
*Примечание: Поскольку в стандартном Stylelint нет прямого правила на общее количество строк в файле, можно использовать плагин `stylelint-files-limit` или написать простое регулярное выражение.*

---

## 3. Настройка IDE для автопроверки

Чтобы ошибки подсвечивались красным цветом прямо в окне редактора, в IDE должны быть установлены расширения:
1. **ESLint** (от Dirk Baeumer)
2. **Stylelint** (от Stylelint)

### Включение авто-фиксации при сохранении (`.vscode/settings.json`):
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "stylelint.validate": ["css", "scss"]
}
```

---

## 4. Скрипты запуска в `package.json`

Добавьте команды проверки в секцию `"scripts"`:

```json
"scripts": {
  "lint": "eslint . --ext .js,.ts && stylelint \"**/*.css\"",
  "lint:fix": "eslint . --ext .js,.ts --fix && stylelint \"**/*.css\" --fix"
}
```
