// auto-dev.js
// This script is intended to be run from the 'tool-scripts/' directory.

/**
 * @file auto-dev.js
 * @module auto-dev
 * @author @RuthvikUpputuri
 * @license MIT
 * @requires Node.js 14 or higher
 * @version 2.0.0 (Adapted for tool-scripts/, src/dist structure, and calls html-refactor.js)
 * @description Provides an automated development workflow:
 *              1. Watches for new HTML files in 'src/html/' to trigger 'html-refactor.js', then a CSS build.
 *              2. Watches for changes in existing 'src/html/' files to trigger a CSS build.
 *              3. Watches for changes in 'src/assets/styles/' CSS files (e.g., those created by html-refactor) to trigger a CSS build.
 *              4. Watches for changes in the Tailwind CSS configuration file to trigger a CSS build.
 *              5. Debounces build triggers to prevent rapid, successive builds.
 * @requires fs Node.js module
 * @requires path Node.js module
 * @requires child_process Node.js module (for execSync)
 * @requires chokidar Node.js module (for file watching)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

// --- Configuration ---

/**
 * @const {string} projectBasePath - Absolute path to the project's root directory.
 * Assumes this script (auto-dev.js) is located in a subdirectory (e.g., 'tool-scripts/')
 * one level down from the project root.
 */
const projectBasePath = path.resolve(__dirname, '..');

/** 
 * @const {string} HTML_SRC_DIR_FROM_ROOT - Path to the source HTML directory, relative to projectBasePath.
 * Example: 'src/html'
 */
const HTML_SRC_DIR_FROM_ROOT = 'src/html';

/**
 * @const {string} CSS_SRC_DIR_FROM_ROOT - Path to the source CSS directory (where html-refactor.js outputs),
 * relative to projectBasePath.
 * Example: 'src/assets/styles'
 */
const CSS_SRC_DIR_FROM_ROOT = 'src/assets/styles';

/**
 * @const {string} TAILWIND_CONFIG_FILENAME - Filename of the Tailwind CSS configuration file,
 * expected to be at the projectBasePath.
 */
const TAILWIND_CONFIG_FILENAME = 'tailwind.config.js';

/**
 * @const {string[]} HTML_PROCESSING_IGNORE_DIRECTORIES - Array of directory paths (relative to projectBasePath)
 * that should NOT be treated as sources for new HTML files needing processing by html-refactor.js.
 * Used as a secondary filter if Chokidar is watching broadly or if files are within HTML_SRC_DIR_FROM_ROOT
 * but still need to be ignored for processing (e.g. drafts, templates not meant for direct output).
 * Note: 'dist/' and 'tool-scripts/' are already globally ignored by Chokidar.
 */
const HTML_PROCESSING_IGNORE_DIRECTORIES = [
  CSS_SRC_DIR_FROM_ROOT,    // Don't process CSS files as HTML
  'src/assets/',            // Generally, assets in src/assets are not HTML to be processed by html-refactor
  // 'dist/',               // Already in CHOKIDAR_GLOBAL_IGNORE_PATTERNS
  'node_modules/',
  'functions/',
  // 'tool-scripts/',       // Already in CHOKIDAR_GLOBAL_IGNORE_PATTERNS
].map(dir => dir.endsWith(path.sep) ? dir : dir + path.sep); // Ensure trailing slash for startsWith comparisons

/**
 * @const {string[]} CHOKIDAR_GLOBAL_IGNORE_PATTERNS - Array of glob patterns for Chokidar to globally ignore.
 * These paths are relative to the watched root (projectBasePath).
 * Essential for preventing issues with node_modules, .git, output directories, etc.
 */
const CHOKIDAR_GLOBAL_IGNORE_PATTERNS = [
  'node_modules/**',        // Ignore node_modules folder
  '**/.*',                 // Ignore hidden files and folders (e.g., .git, .vscode, .DS_Store)
  'dist/**',               // Ignore the main distribution output folder
  '**/output/**',           // Ignore any other general 'output' folders
  'functions/**',           // Ignore Firebase Cloud Functions folder (if present at root)
  '*.log',                 // Ignore log files
  'tool-scripts/**',       // Ignore the directory containing this script and other tools
];

// Note: CSS_BOILERPLATE previously here is removed as html-refactor.js now handles Tailwind directive prepending.

/**
 * @const {string} BUILD_COMMAND - The npm script command used to build Tailwind CSS.
 * This typically corresponds to a script in `package.json` (e.g., "npm run build:css").
 */
const BUILD_COMMAND = 'npm run build:css'; // This will execute `node tool-scripts/build-css.js`

/**
 * @const {number} BUILD_DEBOUNCE_MS - Debounce delay in milliseconds for triggering builds.
 * Prevents rapid, successive builds if multiple files change quickly.
 */
const BUILD_DEBOUNCE_MS = 400;

// --- End of Configuration ---


// --- Helper Functions ---

let buildDebounceTimeout; // Timeout ID for debouncing build calls
const LOG_PREFIX = '@';     // Prefix for log messages
const LOG_SUFFIX = 'GMT';   // Suffix for timestamps in logs

/**
 * Gets the current timestamp in HH:MM:SS format.
 * @returns {string} Current time.
 */
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Logs a message to the console with a standard prefix and timestamp.
 * @param {string} message - The message to log.
 */
function log(message) {
  console.log(`${LOG_PREFIX} [${getTimestamp()} ${LOG_SUFFIX}] ${message}`);
}

/**
 * Logs an error message to the console.
 * @param {string} message - The primary error message.
 * @param {Error|string} [error] - Optional Error object or additional error string.
 */
function logError(message, error) {
  console.error(`${LOG_PREFIX} [${getTimestamp()} ${LOG_SUFFIX}] ❌ ERROR: ${message}`);
  if (error && error.message) {
    console.error(`   ${error.message}`);
    if (error.stack) console.debug(error.stack); // Full stack at debug for less noise
  } else if (error) {
    console.error(`   ${error}`);
  }
}

/**
 * Schedules or re-schedules the CSS build command after a debounce period.
 * @param {string} reason - A short description of why the build is being triggered.
 */
function scheduleBuild(reason) {
  clearTimeout(buildDebounceTimeout); 
  log(`⏳ Build scheduled (Reason: ${reason}). Waiting ${BUILD_DEBOUNCE_MS}ms for further changes...`);
  buildDebounceTimeout = setTimeout(() => {
    runBuild(reason); // Pass the original reason for context in the build log
  }, BUILD_DEBOUNCE_MS);
}

/**
 * Runs the CSS build command (defined by BUILD_COMMAND).
 * Logs the process and any errors. The CWD for the command is projectBasePath.
 * @param {string} finalReason - The reason the build was ultimately triggered (passed from scheduleBuild).
 */
function runBuild(finalReason) {
  log(`\n🔄 Kicking off CSS build (Reason: ${finalReason})...`);
  try {
    // Execute the build command from the project root.
    execSync(BUILD_COMMAND, { stdio: 'inherit', cwd: projectBasePath });
    log('✅ Build successful.');
  } catch (error) {
    // execSync throws on non-zero exit code, error object often contains stderr/stdout.
    logError('Build command failed. Check output above for details from the build process.', error.message || error);
  }
}

/**
 * Logs an error originating from a file watcher.
 * @param {string} watcherName - Name of the watcher that errored (e.g., "Main Watcher").
 * @param {Error} error - The error object from the watcher.
 */
function logWatcherError(watcherName, error) {
  logError(`Error in ${watcherName}:`, error);
}

// --- Main Logic ---

log('🚀 Starting Supercharged Auto-Dev Watcher...');
log(`   Project base path (projectBasePath): ${projectBasePath}`);
log(`   Source HTML directory being monitored: ${path.join(projectBasePath, HTML_SRC_DIR_FROM_ROOT)}`);
log(`   Source CSS directory being monitored: ${path.join(projectBasePath, CSS_SRC_DIR_FROM_ROOT)}`);

// --- Initial Setup: Ensure critical source directories exist ---
const sourceCssDirFullPath = path.join(projectBasePath, CSS_SRC_DIR_FROM_ROOT);
const sourceHtmlDirFullPath = path.join(projectBasePath, HTML_SRC_DIR_FROM_ROOT);
const tailwindConfigFullPath = path.join(projectBasePath, TAILWIND_CONFIG_FILENAME);

// Ensure the source CSS directory (e.g., 'src/assets/styles/') exists, as html-refactor.js will write to it.
if (!fs.existsSync(sourceCssDirFullPath)) {
  log(`📂 Source CSS directory "${CSS_SRC_DIR_FROM_ROOT}" not found. Creating it at: ${sourceCssDirFullPath}`);
  try {
    fs.mkdirSync(sourceCssDirFullPath, { recursive: true });
    log(`   ✅ Source CSS directory created successfully.`);
  } catch (error) {
    logError(`Failed to create source CSS directory "${sourceCssDirFullPath}". Exiting.`, error);
    process.exit(1);
  }
}
// Ensure the source HTML directory exists, as we will be watching it.
if (!fs.existsSync(sourceHtmlDirFullPath)) {
    log(`📂 Source HTML directory "${HTML_SRC_DIR_FROM_ROOT}" not found. Creating it at: ${sourceHtmlDirFullPath}`);
    try {
      fs.mkdirSync(sourceHtmlDirFullPath, { recursive: true });
      log(`   ✅ Source HTML directory created successfully.`);
    } catch (error) {
      logError(`Failed to create source HTML directory "${sourceHtmlDirFullPath}". Exiting.`, error);
      process.exit(1);
    }
  }

// Run an initial build. This processes any existing CSS in src/assets/styles into dist/assets/css.
runBuild('Initial startup build');

// --- File System Watcher Setup ---
log(`\n👀 Watching for file changes within project base path: ${projectBasePath}`);
log(`   - HTML files in: ${sourceHtmlDirFullPath}`);
log(`   - CSS files in: ${sourceCssDirFullPath}`);
log(`   - Tailwind config: ${tailwindConfigFullPath}`);
log(`   Globally ignoring via Chokidar: ${CHOKIDAR_GLOBAL_IGNORE_PATTERNS.join(', ')}`);
// HTML_PROCESSING_IGNORE_DIRECTORIES is used as a secondary filter within the event handler.

const watcher = chokidar.watch(projectBasePath, {
  ignored: CHOKIDAR_GLOBAL_IGNORE_PATTERNS.map(p => path.join(projectBasePath, p)), // Ensure patterns are absolute for Chokidar
  persistent: true,
  ignoreInitial: true,    // Don't trigger events for files existing at startup
  depth: 99,              // Watch all subdirectories
  awaitWriteFinish: {     // Wait for file writes to finish before triggering events
    stabilityThreshold: 200,
    pollInterval: 100
  }
});

// --- Event Handling ---
watcher.on('all', (event, filePathFromWatcher) => {
  // filePathFromWatcher is usually relative to the watched path (projectBasePath), but can vary.
  // Resolve it to an absolute path then make it relative to projectBasePath for consistent handling.
  const absoluteFilePath = path.isAbsolute(filePathFromWatcher) ? filePathFromWatcher : path.resolve(projectBasePath, filePathFromWatcher);
  const relativeFilePath = path.relative(projectBasePath, absoluteFilePath); // Path relative to project root, e.g., "src/html/index.html"
  const fileExtension = path.extname(relativeFilePath).toLowerCase();

  // Uncomment for verbose debugging of all Chokidar events:
  // log(`[CHOKIDAR RAW EVENT] Event: '${event}', Path by watcher: '${filePathFromWatcher}', Resolved relative: '${relativeFilePath}'`);

  // --- Tailwind Config Change ---
  // If tailwind.config.js changes, schedule a build.
  if (absoluteFilePath === tailwindConfigFullPath) {
    if (event === 'change' || event === 'add') { // 'add' handles if it was deleted and re-added
      scheduleBuild(`Tailwind config ${TAILWIND_CONFIG_FILENAME} ${event === 'add' ? 'added' : 'changed'}`);
    }
    return; // Event handled
  }

  // --- Source CSS File Change ---
  // If a .css file changes within CSS_SRC_DIR_FROM_ROOT (e.g., 'src/assets/styles/'), trigger a CSS build.
  if (fileExtension === '.css' && relativeFilePath.startsWith(CSS_SRC_DIR_FROM_ROOT + path.sep)) {
    if (event === 'change' || event === 'add') {
      scheduleBuild(`Source CSS file ${relativeFilePath} ${event === 'add' ? 'added' : 'changed'}`);
    }
    // Note: Deletion of a source CSS file currently does not trigger a specific cleanup in dist/.
    // A full `npm run build` would clean dist/.
    return; // Event handled
  }

  // --- Source HTML File Event ---
  // If a .html file is added or changed within HTML_SRC_DIR_FROM_ROOT (e.g., 'src/html/').
  if (fileExtension === '.html' && relativeFilePath.startsWith(HTML_SRC_DIR_FROM_ROOT + path.sep)) {
    
    // Secondary check against more specific HTML processing ignores.
    const isSpecificallyIgnored = HTML_PROCESSING_IGNORE_DIRECTORIES.some(ignoredDir =>
      relativeFilePath.startsWith(ignoredDir) // These are project-root relative
    );

    if (isSpecificallyIgnored) {
      log(`HTML event for '${relativeFilePath}' ignored due to HTML_PROCESSING_IGNORE_DIRECTORIES match.`); // Replaced logger.debug with log
      return; // Event handled by ignoring
    }

    if (event === 'add') {
      log(`📄 New source HTML file detected: ${relativeFilePath}`); // Replaced logger.info with log
      log(`   -> Invoking html-refactor.js for: ${relativeFilePath}`); // Replaced logger.info with log
      try {
        // html-refactor.js is expected to be a sibling in the 'tool-scripts/' directory.
        // __dirname for auto-dev.js is '.../project-root/tool-scripts/'
        const htmlRefactorScriptPath = path.join(__dirname, 'html-refactor.js');
        
        // Execute html-refactor.js. It expects the file path argument to be relative to PROJECT_ROOT.
        // html-refactor.js will handle outputting to 'dist/' (HTML, JS) and 'src/assets/styles/' (CSS).
        execSync(`node "${htmlRefactorScriptPath}" "${relativeFilePath}"`, { stdio: 'inherit', cwd: projectBasePath });
        log(`   ✅ html-refactor.js successfully completed for: ${relativeFilePath}.`); // Replaced logger.info with log
      } catch (error) {
        logError(`html-refactor.js execution failed for new file ${relativeFilePath}.`, error.message || error);
        // Continue to scheduleBuild, as html-refactor might have created the CSS file before erroring,
        // or other unrelated changes might need building.
      }
      // After html-refactor.js runs (which creates/updates a CSS file in src/assets/styles/),
      // schedule a build. build-css.js will then process it.
      scheduleBuild(`New source HTML file ${relativeFilePath} processed by html-refactor`);

    } else if (event === 'change') {
      log(`🔄 Change detected in source HTML file: ${relativeFilePath}`); // Replaced logger.info with log
      log(`   -> Invoking html-refactor.js for: ${relativeFilePath}`); // Replaced logger.info with log
      try {
        // html-refactor.js is a sibling in the 'tool-scripts/' directory.
        const htmlRefactorScriptPath = path.join(__dirname, 'html-refactor.js');
        
        // Execute html-refactor.js. It expects the file path argument to be relative to PROJECT_ROOT.
        execSync(`node "${htmlRefactorScriptPath}" "${relativeFilePath}"`, { stdio: 'inherit', cwd: projectBasePath });
        log(`   ✅ html-refactor.js successfully completed for changed file: ${relativeFilePath}.`); // Replaced logger.info with log
      } catch (error) {
        logError(`html-refactor.js execution failed for changed file ${relativeFilePath}.`, error.message || error);
      }
      // After html-refactor.js runs (which might update a CSS file in src/assets/styles/),
      // schedule a build. build-css.js will then process it.
      // This also handles cases where only HTML classes were changed, necessitating a Tailwind scan.
      scheduleBuild(`Change in source HTML file ${relativeFilePath} processed by html-refactor`);
    }
    // Note: Deletion of a source HTML file currently does not trigger specific cleanup of its outputs in dist/ or src/assets/styles/.
    // A full `npm run build` (which cleans dist/) would handle this.
    return; // Event handled
  }
  // log(`Irrelevant event or file path for auto-dev: ${event} on ${relativeFilePath}`); // Replaced logger.debug with log (commented out)
});

watcher.on('error', (error) => logWatcherError('Main Watcher', error));

log(`\n👀 File watcher is active. Build debounce set to ${BUILD_DEBOUNCE_MS}ms. Press Ctrl+C to stop.`);
log(`   Events will trigger a build after a brief pause to bundle rapid changes.`);
