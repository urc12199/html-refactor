// build-css.js

/**
 * @file build-css.js
 * @module build-css
 * @author @RuthvikUpputuri
 * @license MIT
 * @version 2.0.0 (Adapted for tool-scripts/ location and src/dist structure)
 * @description Automates building Tailwind CSS.
 *              Reads source CSS from 'src/assets/styles/' and outputs to 'dist/assets/css/'.
 *              Logs the NODE_ENV to help debug CSS minification.
 * @requires fs Node.js module
 * @requires path Node.js module
 * @requires child_process Node.js module (for execSync)
 */

const fs = require('fs-extra'); // fs-extra for ensureDirSync convenience
const path = require('path');
const { execSync } = require('child_process');

// --- Path Configuration ---

// __dirname is the directory where this script (build-css.js) is located (i.e., tool-scripts/)
const scriptDir = __dirname;
// projectRootDir is one level up from tool-scripts/
const projectRootDir = path.resolve(scriptDir, '..');

// Source directory for CSS files (extracted by html-refactor.js, containing Tailwind directives)
const stylesDir = path.join(projectRootDir, 'src', 'assets', 'styles');

// Destination directory for processed CSS files (compiled by Tailwind)
const outputDir = path.join(projectRootDir, 'dist', 'assets', 'css');

// --- Main Build Logic ---
console.log('🚀 [build-css] Starting Tailwind CSS build process...');
console.log(`   [build-css] Current NODE_ENV: ${process.env.NODE_ENV}`); // Log NODE_ENV
console.log(`   [build-css] Project Root Detected: ${projectRootDir}`);
console.log(`   [build-css] Source CSS Directory (Input): ${stylesDir}`);
console.log(`   [build-css] Output CSS Directory (Output): ${outputDir}`);

try {
  // Ensure the source styles directory exists (it should, as html-refactor creates it)
  if (!fs.existsSync(stylesDir)) {
    console.warn(`   [build-css] ⚠️ Source CSS directory not found: ${stylesDir}. Nothing to build.`);
    // Optionally create it if it's considered essential even if empty
    // fs.ensureDirSync(stylesDir);
    // console.log(`   [build-css] Created missing source CSS directory: ${stylesDir}`);
    return; // Exit if no source directory to read from
  }

  // Ensure the output directory exists
  fs.ensureDirSync(outputDir); // fs-extra creates it recursively if it doesn't exist
  console.log(`   [build-css] Ensured output directory exists: ${outputDir}`);
  
  // Get all files from the styles directory
  const files = fs.readdirSync(stylesDir);

  // Filter for .css files only
  const cssFiles = files.filter(file => path.extname(file).toLowerCase() === '.css');

  if (cssFiles.length === 0) {
    console.warn('   [build-css] ⚠️ No .css files found in the source styles directory to process.');
    return;
  }

  console.log(`   [build-css] Found ${cssFiles.length} CSS file(s) to process.`);

  // Loop through each CSS file and build it
  cssFiles.forEach(file => {
    const inputFile = path.join(stylesDir, file);
    // Sanitize basename just in case, though html-refactor should produce safe names
    const baseName = path.basename(file, '.css').replace(/[^a-zA-Z0-9_.-]/g, '_'); 
    const outputFile = path.join(outputDir, `${baseName}-output.css`);

    // Use npx to ensure local or global Tailwind CLI is used.
    // Input and output paths should be absolute or correctly relative to where Tailwind runs (projectRootDir).
    // Using absolute paths is safest here.
    // Add --minify flag if NODE_ENV=production for explicit minification, though Tailwind usually does this.
    const minifyFlag = process.env.NODE_ENV === 'production' ? '--minify' : '';
    // Explicitly point to postcss.config.js. Assuming it's in projectRootDir.
    const postCssConfigPath = path.join(projectRootDir, 'postcss.config.js');
    const command = `npx tailwindcss --postcss "${postCssConfigPath}" -i "${inputFile}" -o "${outputFile}" ${minifyFlag}`;

    console.log(`   [build-css] Building: ${file}...`);
    console.log(`     > ${command}`);

    try {
      // Execute the Tailwind CLI command.
      // `cwd` is set to projectRootDir to ensure Tailwind finds its config (tailwind.config.js)
      // and resolves any content paths correctly.
      execSync(command, { stdio: 'inherit', cwd: projectRootDir });
      console.log(`   [build-css] ✅ Successfully built: ${path.relative(projectRootDir, outputFile)}\n`);
    } catch (error) {
      // Log specific error for this file but continue with others if possible,
      // or rethrow to stop the whole build: For now, log and continue.
      console.error(`   [build-css] ❌ ERROR building ${file}: ${error.message}`);
      // To make it stop the build, we could add: throw error;
    }
  });

  console.log('✅ [build-css] CSS build process finished.');

} catch (error) {
  // Catch errors from ensureDirSync, readdirSync, or if an error was re-thrown from forEach.
  console.error(`❌ [build-css] A critical error occurred during the build process:`);
  if (error.message) console.error(error.message);
  if (error.stack) console.error(error.stack);
  process.exit(1); // Exit with an error code
}
