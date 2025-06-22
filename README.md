# HTML Refactor CLI (`html-refactor`)

[![npm version](https://badge.fury.io/js/html-refactor.svg)](https://badge.fury.io/js/html-refactor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/RuthvikUpputuri/html-refactor.svg?style=social&label=Star&maxAge=2592000)](https://github.com/RuthvikUpputuri/html-refactor/stargazers)

`html-refactor` (aliased as `href` and `htref`) is a command-line tool designed to automate the refactoring of HTML files. It helps keep your markup clean by extracting inline CSS and JavaScript into separate, manageable files, and updates your HTML to link to these new assets.

## Overview

Working with legacy HTML or rapidly prototyped pages often results in inline styles and scripts. While convenient initially, this can lead to maintenance headaches, poor performance, and difficulties in managing a consistent codebase. `html-refactor` addresses this by:

*   **Discovering** HTML files within your project based on flexible glob patterns.
*   **Extracting** CSS from `<style>` tags and `style` attributes into dedicated `.css` files.
*   **Extracting** JavaScript from inline `<script>` tags (those without a `src` attribute) into separate `.js` files.
*   **Updating** HTML `<head>` sections to include `<link rel="stylesheet">` tags for the newly created CSS files, pointing to their expected compiled location.
*   **Modifying** inline `<script>` tags to use the `src` attribute, linking to the extracted JavaScript files.

This tool aims to streamline a common but often tedious part of web development and maintenance.

## Features

*   **Interactive Setup:** On first run or with `--init`, guides you through creating a `href.config.json` file.
*   **Configuration File:** Stores your project-specific settings for consistent refactoring.
*   **Flexible HTML Discovery:** Uses glob patterns to find HTML files, with support for ignore patterns.
*   **CSS Extraction:**
    *   Extracts content from `<style>` tags.
    *   Extracts inline `style="..."` attributes, converting them to uniquely generated CSS classes.
*   **JavaScript Extraction:** Extracts content from inline `<script>` tags.
*   **Smart Linking:** Adds `<link>` tags for CSS, respecting your project's compiled asset structure.
*   **Multiple JS Output Strategies:** Save extracted JS files relative to their HTML source or in a centralized directory.
*   **Dry Run Mode (`--dry-run`):** See what changes would be made without actually modifying any files. Essential for testing!
*   **File Backups:** Optionally creates `.bak` files of your HTML before modification.
*   **Detailed Logging:** Configurable log levels and outputs logs to both console (with colors) and a timestamped file (defaulting to `.href-logs/`).
*   **Customizable File Naming:** Control over generated CSS/JS filenames, including prefix stripping and length limits.
*   **Robust Project Root Detection:** Intelligently finds your project's root directory.

## Prerequisites

*   Node.js (v14.x or later recommended)
*   npm (usually comes with Node.js)

### Note 

`chalk` from v5 is ESM-only. If your project is CommonJS *(which `refactor-html.js` currently is)*, you'd typically use `chalk@4`. For `inquirer` v9 is ESM. Your current script uses `require`, so ensure you have CommonJS compatible versions, or plan to refactor to ESM if using latest versions of these libraries.

## Installation

You can install `html-refactor` globally or as a development dependency in your project.

**Global Installation (Recommended for CLI use anywhere):**

```bash
npm install -g html-refactor
```

After global installation, you can run the `html-refactor`, `href`, or `htref` command from any directory.

**Local Installation (Per Project):**

```bash
npm install --save-dev html-refactor
```

If installed locally, you can run it using `npx html-refactor` (or `npx href`, `npx htref`) or by adding it to your `package.json` scripts:

```json
 // package.json
"scripts": {
  "refactor": "html-refactor"
}
```

Then run `npm run refactor`.

## Getting Started (Quick Start)

1.  **Navigate to your project directory:**
    ```bash
    cd /path/to/your-project
    ```

2.  **Run the init command (or just run `html-refactor`, `href`, or `htref` for the first time):**
    ```bash
    html-refactor --init
    # OR
    href --init
    ```
    This will start an interactive setup process to create a `href.config.json` file in your project root. It will ask you to confirm/provide paths for:
    *   Your project root.
    *   HTML source file patterns.
    *   Output directory for extracted CSS.
    *   Output strategy and directory for extracted JS.
    *   The directory where your *final, compiled* CSS (e.g., after Tailwind processing) will live, so it can generate correct `<link>` tags.
    *   And other preferences like logging and backups.

3.  **Review the generated `href.config.json`** and adjust if necessary.

4.  **Run the refactor process:**
    ```bash
    html-refactor
    # OR
    href
    ```
    You can also do a dry run first to see what would happen:
    ```bash
    html-refactor --dry-run
    # OR
    href --dry-run
    ```

5.  **Run your CSS Build Process:**
    `html-refactor` extracts *source* CSS. If you use a CSS preprocessor, bundler, or a framework like Tailwind CSS, **you need to run your existing build command** (e.g., `npm run build:css`, `npx tailwindcss -i ... -o ...`) after `html-refactor`. This build process should be configured to pick up the newly extracted CSS files from the `stylesOutputDir` you specified and output them to your `compiledCssLinkDir`.

## CLI Usage

```
html-refactor [options]
href [options]
htref [options]
```

**Common Options:**

| Option                 | Alias | Description                                                                         | Default     |
| ---------------------- | ----- | ----------------------------------------------------------------------------------- | ----------- |
| `--init`               | `-i`  | Force interactive configuration setup, creating/overwriting `href.config.json`.     | `false`     |
| `--project-root <path>`| `-r`  | Specify the project root directory. Overrides auto-detection and config file value. | (auto)      |
| `--dry-run`            | `-d`  | Simulate the process without modifying any files.                                   | `false`     |
| `--log-level <level>`  | `-l`  | Set log level (DEBUG, INFO, WARN, ERROR, SILENT). Overrides config.                 | `INFO`      |
| `--yes`                | `-y`  | Skip interactive prompts during setup and use defaults/existing config.             | `false`     |
| `--html-sources <globs>`|       | Comma-separated glob patterns for HTML source files. Overrides config.              | (from config)|
| `--styles-output <dir>`|       | Directory for extracted CSS files (relative to project root). Overrides config.     | (from config)|
| `--create-backups`     |       | Create .bak backups of HTML files. Overrides config setting.                        | (from config)|
| `--help`               | `-h`  | Show help message.                                                                  |             |
| `--version`            | `-v`  | Show version number.                                                                |             |

## Configuration File (`href.config.json`)

When you run `html-refactor --init` or the tool runs for the first time in a project, it creates a `href.config.json` file in your project's root directory. This file stores your preferences for how the refactoring should be done.

Here's an example with explanations of each field:

```json
{
  "projectRoot": "/Users/yourname/projects/my-website",
  "htmlSourcePatterns": [
    "src/**/*.html",
    "public/index.html",
    "!**/node_modules/**"
  ],
  "stylesOutputDir": "src/styles/extracted-inline",
  "jsOutputDirStrategy": "relativeToHtml",
  "jsCentralOutputDir": "src/js/extracted-inline",
  "compiledCssLinkDir": "dist/assets/css",
  "ignorePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    ".href-logs/**", // Default log directory
    "href.config.json" // The config file itself
  ],
  "logLevel": "INFO",
  "logFilePath": "/Users/yourname/projects/my-website/.href-logs/refactor-2025-10-27T10-30-00.000Z.log",
  "createBackups": true,
  "maxFilenameLength": 100,
  "htmlPrefixesToOmitFromCssName": [
    "src/pages/",
    "src/components/",
    "public/"
  ]
}
```

**Configuration Details:**

*   `projectRoot`: Absolute path to your project. Usually auto-detected correctly.
*   `htmlSourcePatterns`: An array of glob patterns telling the tool where to find your HTML files. Use `!` for negation (ignore).
    *   Example: `["pages/**/*.html", "!pages/archive/**"]`
*   `stylesOutputDir`: Path (relative to `projectRoot`) where new CSS files (containing extracted styles) will be created. Your CSS build process should watch this directory.
*   `jsOutputDirStrategy`:
    *   `relativeToHtml`: Extracted JS files are saved in the same directory as their source HTML file.
    *   `centralized`: Extracted JS files are saved into the `jsCentralOutputDir`.
*   `jsCentralOutputDir`: Path (relative to `projectRoot`) for extracted JS files if `jsOutputDirStrategy` is `centralized`.
*   `compiledCssLinkDir`: Crucial for correct CSS linking. This is the path (relative to `projectRoot`) where your **final, browser-ready CSS files will reside after your own build process (e.g., Tailwind, PostCSS, Sass) has run.** The `<link>` tags added to your HTML will point here.
    *   Example: If your HTML is at `src/index.html` and your compiled CSS will be at `dist/assets/css/index.css`, and `projectRoot` is the parent of `src` and `dist`, then `compiledCssLinkDir` should be `dist/assets/css`.
*   `ignorePatterns`: An array of glob patterns for files/directories to completely ignore during the scan. These supplement default ignores like `node_modules`.
*   `logLevel`: Controls how much detail is printed to the console and written to the log file.
*   `logFilePath`: The absolute path where the detailed log file will be saved. A new timestamped log file is typically created for each run by default in the `.href-logs` directory.
*   `createBackups`: If `true`, a copy of each HTML file with a `.bak` extension will be made before any modifications.
*   `maxFilenameLength`: Limits the length of generated filenames for CSS and JS to prevent issues with long paths, adding a hash if truncation occurs.
*   `htmlPrefixesToOmitFromCssName`: An ordered array of string prefixes. When generating a CSS filename from an HTML file's path (e.g., `src/pages/about.html` -> `pages_about.css`), these prefixes are checked and the first one that matches the start of the relative HTML path is removed.

## Workflow with Build Tools (e.g., Tailwind CSS)

`html-refactor` is designed to work *with* your existing CSS build pipeline, not replace it.

1.  **Configure `html-refactor`:**
    *   Set `stylesOutputDir` to a directory where `html-refactor` will place newly extracted *source* CSS files (e.g., `src/css/extracted`).
    *   Set `compiledCssLinkDir` to the directory where your build tool (Tailwind, PostCSS, etc.) outputs its *final, processed* CSS files (e.g., `public/build/css` or `dist/assets/css`).

2.  **Run `html-refactor` (or `href` / `htref`):**
    ```bash
    html-refactor
    ```
    *   This extracts inline styles to files in `stylesOutputDir`.
    *   It updates your HTML files to link to the *expected location* of the compiled CSS in `compiledCssLinkDir` (e.g., `<link rel="stylesheet" href="public/build/css/my-page.css">`).

3.  **Run Your CSS Build Tool:**
    *   Your Tailwind/PostCSS/Sass configuration should be set up to:
        *   **Input/Watch:** The `stylesOutputDir` (e.g., `src/css/extracted/**/*.css`) along with your other primary CSS entry points.
        *   **Output:** The `compiledCssLinkDir` (e.g., `public/build/css`).
    *   Example Tailwind command (conceptual):
        ```bash
        npx tailwindcss -i ./src/css/main.css -i ./src/css/extracted/**/*.css -o ./public/build/css/style.css --watch
        ```
        (You'll likely have this in your `package.json` scripts).

Now, when you browse your site, the HTML will correctly link to the CSS processed by Tailwind (or your chosen tool).

## Logging

*   **Console Output:** Provides real-time feedback, color-coded by severity. Controlled by `logLevel`.
*   **Log File:** A detailed, timestamped log file is created for each run (by default in `.href-logs/` in your project root). This is useful for debugging or auditing changes. The path and verbosity are configurable.

## Compatibility and Limitations (v1.0.0)

**Compatibility:**

*   **Node.js:** Recommended v14.x or later. Tested with Node v16.x, v18.x. (Requires CommonJS compatible versions of dependencies like `chalk@4`, `inquirer@8`).
*   **Operating Systems:** Expected to work on Windows, macOS, and Linux.
*   **HTML:** Designed for standard HTML files. While it uses Cheerio for parsing, heavily malformed HTML might lead to unexpected results.

**Limitations:**

*   **No CSS/JS Preprocessing:** This tool only extracts raw CSS and JavaScript. It does not compile Sass/Less/TypeScript or process CSS with PostCSS/Tailwind directly. It relies on your existing build pipeline for such tasks.
*   **Simple Script Extraction:** Extracted JavaScript is saved as plain script files. The tool does not handle module bundling (e.g., Webpack, Rollup), complex import/export statements within the extracted script, or dynamic script loading.
*   **Static HTML Focus:** Best suited for static HTML files or templates where inline styles/scripts are clearly defined. May require careful glob pattern configuration if used with server-side templating languages that generate HTML dynamically.
*   **Performance:** While generally efficient, performance on extremely large projects (tens of thousands of HTML files) or exceptionally large individual HTML files (many megabytes) has not been formally benchmarked for v1.0.0.
*   **Error Recovery:** Relies on Cheerio for HTML parsing. While Cheerio is robust, extremely broken HTML might not be parsed as intended, potentially leading to incomplete extractions.
*   **No Dependency Resolution:** Does not analyze or resolve dependencies within the extracted JavaScript code.
*   **CSS Specificity and Order:** While CSS from `<style>` tags and `style` attributes is extracted, the order of linked stylesheets and the specificity of new rules might need review, especially in complex projects. It's recommended to link the extracted CSS *before* main stylesheets if the extracted styles are meant to be overridden. The tool appends the link to the `<head>`.
*   **FUTURE VERSIONS WILL SUPPORT ALL ABOVE FEATURES**.
*   **Future versions will also include auto build and compile inline css based on tailwind postCSS**

   
## Contributing  

  For detailed contributions look for `Contributions.md` file in the root directory

Contributions are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/RuthvikUpputuri/html-refactor).

When contributing, please:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Add tests if applicable.
5. Ensure your code lints and follows the project style.
6. Submit a pull request with a clear description of your changes.

## License

MIT - See the `LICENSE` file for details.
Copyright (c) 2025 Ruthvik Upputuri

## Author

Ruthvik Upputuri
([https://github.com/RuthvikUpputuri](https://github.com/RuthvikUpputuri))