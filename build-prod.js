// build-prod.js

/**
 * @file build-prod.js
 * @version 1.1.0 (Added JSDoc, parallel processing for HTML/JS)
 * @description Orchestrates the full production build process:
 *              1. Cleans the 'dist/' directory.
 *              2. Processes source HTML: (Uses html-refactor.js logic)
 *                 - Extracts CSS to 'src/assets/styles/'.
 *                 - Prepares JS data (content and paths for 'dist/').
 *                 - Minifies processed HTML and saves to 'dist/'.
 *              3. Minifies extracted JavaScript files and saves to 'dist/'.
 *              4. Compiles and minifies CSS from 'src/assets/styles/' to 'dist/assets/css/' (via build:css npm script).
 *              5. Optimizes and copies images from 'src/assets/images/' to 'dist/assets/images/'.
 *              6. Copies static root files (robots.txt, sitemap.xml) from 'src/'.
 * @author @RuthvikUpputuri
 */

const fs = require('fs-extra');
const path = require('path');
const { globSync } = require('glob');
const { minify: minifyHtml } = require('html-minifier-terser');
// const { minify: minifyJs } = require('html-minifier-terser'); // Will use Terser directly
const Terser = require('terser'); // For direct JS minification
const cheerio = require('cheerio'); // Added for parsing HTML to fix image paths
// imagemin and its plugins will be dynamically imported within optimizeAndCopyImages
const { execSync } = require('child_process');

// Import the core refactoring logic from html-refactor.js
// Assuming html-refactor.js is a sibling in the 'tool-scripts/' directory.
const { performHtmlRefactoringLogic } = require('./html-refactor.js'); 

// --- Path Configuration ---
const scriptDir = __dirname; // .../project-root/tool-scripts
const projectRootDir = path.resolve(scriptDir, '..'); // .../project-root

const SRC_DIR = path.join(projectRootDir, 'src');
const DIST_DIR = path.join(projectRootDir, 'dist');

const SRC_HTML_DIR = path.join(SRC_DIR, 'html'); 
const SRC_ASSETS_IMAGES_DIR = path.join(SRC_DIR, 'assets', 'images');
const SRC_ROBOTS_TXT = path.join(SRC_DIR, 'robots.txt');
const SRC_SITEMAP_XML = path.join(SRC_DIR, 'sitemap.xml');

const DIST_ASSETS_IMAGES_DIR = path.join(DIST_DIR, 'assets', 'images');
const DIST_ROBOTS_TXT = path.join(DIST_DIR, 'robots.txt');
const DIST_SITEMAP_XML = path.join(DIST_DIR, 'sitemap.xml');

// --- Logger ---
/** @param {string} message */
function log(message) { console.log(`[build-prod] ${message}`); }
/** @param {string} message, @param {Error|string} [error] */
function logError(message, error) {
  console.error(`[build-prod] ❌ ERROR: ${message}`);
  if (error && error.message) console.error(error.message);
  else if (error) console.error(error);
}
/** @param {string} step */
function logStep(step) { console.log(`\n[build-prod] STEP: ${step}...\n`); }

// --- Minification Options ---
const HTML_MINIFIER_OPTIONS = {
  collapseBooleanAttributes: true, collapseWhitespace: true, removeComments: true,
  removeEmptyAttributes: true, removeRedundantAttributes: true, removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true, useShortDoctype: true, minifyCSS: true, minifyJS: true,
  // removeOptionalTags: true, // Consider if this is too aggressive, can break some layouts.
};
// Simplified Terser options for debugging JS minification issues.
// Default options will be used by html-minifier-terser's JS minification.
const TERSER_OPTIONS_FOR_JS_FILES = {}; // Using default options for now.
  // mangle: { toplevel: true }, 
  // compress: { drop_console: true, passes: 2 },
// };

// --- Build Functions ---

/**
 * Cleans the output directory ('dist/').
 * @async
 * @throws {Error} If cleaning fails.
 */
async function cleanDistDirectory() {
  logStep('1. Cleaning output directory (dist/)');
  try {
    await fs.emptyDir(DIST_DIR);
    log('   ✅ dist/ directory cleaned.');
    log('   Deleting and recreating dist/ directory...');
    await fs.remove(DIST_DIR); // Remove the dist directory itself
    await fs.ensureDir(DIST_DIR); // Recreate the dist directory
    log('   ✅ dist/ directory removed and recreated.');
  } catch (error) {
    logError(' ❌ Failed to clean, remove and recreate dist/ directory.', error);
    throw error; 
  }
}

/**
 * Processes source HTML files using performHtmlRefactoringLogic.
 * This step extracts CSS to src/assets/styles and prepares HTML/JS data.
 * @async
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of refactoring result objects.
 * @throws {Error} If any HTML file fails the core refactoring logic.
 */
async function processHtmlAndExtractData() {
  logStep('2. Processing HTML files (Refactoring & Data Extraction)');
  const sourceHtmlFiles = globSync('**/*.html', { cwd: SRC_HTML_DIR, absolute: true, nodir: true });

  if (sourceHtmlFiles.length === 0) {
    log('   ⚠️ No HTML files found in src/html/ to process.');
    return [];
  }
  log(`   Found ${sourceHtmlFiles.length} HTML file(s) to process.`);

  const refactorPromises = sourceHtmlFiles.map(sourceHtmlPath => {
    const relativePathForLog = path.relative(projectRootDir, sourceHtmlPath);
    log(`   Queueing performHtmlRefactoringLogic for: ${relativePathForLog}`);
    return performHtmlRefactoringLogic(sourceHtmlPath)
      .then(result => {
        log(`     Finished performHtmlRefactoringLogic for: ${relativePathForLog}`);
        return result;
      })
      .catch(error => {
        logError(`Failed during performHtmlRefactoringLogic for ${relativePathForLog}.`, error);
        throw error; // Propagate error to stop Promise.all
      });
  });

  const allRefactorResults = await Promise.all(refactorPromises);
  log('   ✅ All HTML files processed for data extraction.');
  return allRefactorResults;
}

/**
 * Minifies HTML content from refactoring results and writes to 'dist/'.
 * @async
 * @param {Array<Object>} refactorResults - Array of results from processHtmlAndExtractData.
 *                                          Each result object now has `destinationHtmlPathForDist`.
 * @throws {Error} If minification or writing fails for any HTML file.
 */
async function minifyAndWriteHtml(refactorResults) {
  logStep('3. Minifying and Writing HTML to dist/');
  if (!refactorResults || refactorResults.length === 0) {
    log('   ⚠️ No HTML results to minify and write.');
    return;
  }

  const minifyPromises = refactorResults.map(async (result) => {
    // Use destinationHtmlPathForDist from the refactor result
    const destHtmlPath = result.destinationHtmlPathForDist; 
    const relativeDestPath = path.relative(projectRootDir, destHtmlPath);
    log(`   Processing HTML for image path rewrites and minification for: ${relativeDestPath}`);
    
    let htmlContentToMinify = result.processedHtmlContent;

    try {
      // Rewrite image paths (and icon links)
      const $ = cheerio.load(htmlContentToMinify);
      let pathsRewrittenCount = 0;
      
      // Handle <img> tags
      $('img').each((i, el) => {
        const tag = $(el);
        let currentPath = tag.attr('src');
        if (currentPath) {
          let newPath = null;
          if (currentPath.startsWith('/src/assets/images/')) {
            newPath = currentPath.replace('/src/assets/images/', '/assets/images/');
          } else if (currentPath.startsWith('src/assets/images/')) {
            newPath = currentPath.replace('src/assets/images/', '/assets/images/');
          }
          // Add more sophisticated relative path handling if needed

          if (newPath && newPath !== currentPath) {
            tag.attr('src', newPath);
            pathsRewrittenCount++;
            log(`     Rewrote <img> src in ${relativeDestPath}: "${currentPath}" -> "${newPath}"`);
          }
        }
        // TODO: Handle srcset for <img>
      });

      // Handle <link rel="icon"> tags
      $('link[rel="icon"]').each((i, el) => {
        const tag = $(el);
        let currentPath = tag.attr('href');
        if (currentPath) {
          let newPath = null;
          if (currentPath.startsWith('/src/assets/images/')) {
            newPath = currentPath.replace('/src/assets/images/', '/assets/images/');
          } else if (currentPath.startsWith('src/assets/images/')) { 
            newPath = currentPath.replace('src/assets/images/', '/assets/images/');
          }
          // Add more sophisticated relative path handling if needed

          if (newPath && newPath !== currentPath) {
            tag.attr('href', newPath);
            pathsRewrittenCount++;
            log(`     Rewrote <link rel="icon"> href in ${relativeDestPath}: "${currentPath}" -> "${newPath}"`);
          }
        }
      });

      if (pathsRewrittenCount > 0) {
        htmlContentToMinify = $.html();
        log(`     ${pathsRewrittenCount} asset path(s) rewritten in ${relativeDestPath}`);
      }

      const minifiedHtml = await minifyHtml(htmlContentToMinify, HTML_MINIFIER_OPTIONS);
      await fs.ensureDir(path.dirname(destHtmlPath));
      await fs.writeFile(destHtmlPath, minifiedHtml, 'utf-8');
      log(`     ✅ Minified and saved HTML: ${relativeDestPath}`);
    } catch (error) {
      logError(` ❌ Failed to process (rewrite paths or minify) or write HTML ${relativeDestPath}.`, error);
      throw error;
    }
  });

  await Promise.all(minifyPromises);
  log('   ✅ HTML minification and writing complete.');
}

/**
 * Minifies JavaScript content extracted by `performHtmlRefactoringLogic` and writes files to 'dist/'.
 * This handles JS that was originally inline in the HTML.
 * Updates a set with the dist paths of processed JS files.
 * @async
 * @param {Array<Object>} refactorResults - Array of results from processHtmlAndExtractData.
 * @param {Set<string>} processedJsDistPaths - A set to record absolute dist paths of JS files handled.
 * @throws {Error} If minification or writing fails for any JS file.
 */
async function minifyAndWriteExtractedJs(refactorResults, processedJsDistPaths) {
  logStep('4. Minifying and Writing JavaScript (from inline HTML) to dist/');
  if (!refactorResults || refactorResults.length === 0) {
    log('   ⚠️ No HTML results found, skipping JS minification from inline.');
    return;
  }

  let totalJsFilesProcessed = 0;
  const minifyJsPromises = [];

  for (const result of refactorResults) {
    if (result.extractedJsFiles && result.extractedJsFiles.length > 0) {
      for (const jsFile of result.extractedJsFiles) {
        totalJsFilesProcessed++;
        
        // Determine the path for the JS file in 'dist/'
        // jsFile.pathInSourceDir is absolute, e.g., /project/src/html/foo/script.js
        // SRC_HTML_DIR is /project/src/html/
        // We want dist/foo/script.js
        const relativeJsPathFromSrcHtml = path.relative(SRC_HTML_DIR, jsFile.pathInSourceDir);
        const fullJsPathInDist = path.join(DIST_DIR, relativeJsPathFromSrcHtml);

        const relativeJsPathForLog = path.relative(projectRootDir, fullJsPathInDist);
        log(`   Preparing to minify JS (from inline HTML) for: ${jsFile.fileName} to ${relativeJsPathForLog}`);
        
        // Log the raw JS content before minification for debugging
        // console.log(`[RAW JS CONTENT for ${relativeJsPathForLog}]:\n------------\n${jsFile.content}\n------------`);
        
        minifyJsPromises.push(
          (async () => { // Wrap in async IIFE to use await for Terser
            try {
              const minifiedJsResult = await Terser.minify({[jsFile.fileName]: jsFile.content}, TERSER_OPTIONS_FOR_JS_FILES);
              if (minifiedJsResult.error) {
                logError(`Error minifying JS ${relativeJsPathForLog}:`, minifiedJsResult.error);
                return; // Skip writing this file
              }
              if (minifiedJsResult.code) {
                await fs.ensureDir(path.dirname(fullJsPathInDist));
                await fs.writeFile(fullJsPathInDist, minifiedJsResult.code, 'utf-8');
                processedJsDistPaths.add(fullJsPathInDist); // Add to set
                log(`     ✅ Minified and saved JS (from inline): ${relativeJsPathForLog}`);
              } else {
                logError(`Failed to minify JS (Terser output code was empty, but no explicit error): ${relativeJsPathForLog}`);
              }
            } catch (error) { // Catch errors from Terser.minify itself or fs operations
              logError(`Exception during JS minification/writing for ${relativeJsPathForLog}.`, error);
              throw error; // Re-throw to fail the Promise.all for this file
            }
          })()
        );
      }
    }
  }

  try {
    await Promise.all(minifyJsPromises);
    if (totalJsFilesProcessed > 0) {
      log(`   ✅ JavaScript (from inline HTML) minification and writing attempts complete for ${totalJsFilesProcessed} file(s).`);
    } else {
      log('   ℹ️ No JavaScript files extracted from inline HTML to process.');
    }
  } catch (overallError) {
    logError('One or more JavaScript files (from inline HTML) failed to minify/write.', overallError.message || overallError);
    throw overallError;
  }
}

/**
 * Globs for all .js files within 'src/html/', minifies them, and copies them to 'dist/',
 * maintaining the subdirectory structure.
 * Skips files that were already processed by `minifyAndWriteExtractedJs`.
 * @async
 * @param {Set<string>} processedJsDistPaths - A set of absolute dist paths for JS files already handled.
 * @throws {Error} If globbing, reading, minification, or writing fails.
 */
async function minifyAndCopySrcHtmlJsFiles(processedJsDistPaths) {
  logStep('4b. Minifying and Copying Other JavaScript files from src/html/ to dist/');
  
  const jsFilesSrcHtml = globSync('**/*.js', { cwd: SRC_HTML_DIR, absolute: true, nodir: true });

  if (jsFilesSrcHtml.length === 0) {
    log('   ℹ️ No .js files found directly in src/html/ subdirectories to process.');
    return;
  }
  log(`   Found ${jsFilesSrcHtml.length} .js file(s) in src/html/ for potential processing.`);

  const minifyPromises = [];
  let processedCount = 0;

  for (const srcJsPath of jsFilesSrcHtml) {
    const relativeJsPathFromSrcHtml = path.relative(SRC_HTML_DIR, srcJsPath);
    const destJsPathInDist = path.join(DIST_DIR, relativeJsPathFromSrcHtml);

    if (processedJsDistPaths.has(destJsPathInDist)) {
      log(`   Skipping already processed JS (from inline): ${path.relative(projectRootDir, destJsPathInDist)}`);
      continue;
    }
    
    processedCount++;
    const relativeJsPathForLog = path.relative(projectRootDir, destJsPathInDist);
    log(`   Preparing to minify and copy JS from src/html: ${relativeJsPathForLog}`);

    minifyPromises.push(
      (async () => {
        try {
          const jsContent = await fs.readFile(srcJsPath, 'utf-8');
          const minifiedJsResult = await Terser.minify(jsContent, TERSER_OPTIONS_FOR_JS_FILES); // Pass content directly

          if (minifiedJsResult.error) {
            logError(`Error minifying JS ${relativeJsPathForLog}:`, minifiedJsResult.error);
            return; 
          }
          if (minifiedJsResult.code) {
            await fs.ensureDir(path.dirname(destJsPathInDist));
            await fs.writeFile(destJsPathInDist, minifiedJsResult.code, 'utf-8');
            log(`     ✅ Minified and saved JS (from src/html): ${relativeJsPathForLog}`);
          } else {
            logError(`❌ Failed to minify JS from src/html (Terser output code was empty): ${relativeJsPathForLog}`);
          }
        } catch (error) {
          logError(`ℹ️ Exception during JS minification/writing for ${relativeJsPathForLog} (from src/html).`, error);
          throw error;
        }
      })()
    );
  }

  try {
    await Promise.all(minifyPromises);
    if (processedCount > 0) {
      log(`   ✅ JS files from src/html/ minification and copying attempts complete for ${processedCount} file(s).`);
    } else if (jsFilesSrcHtml.length > 0) {
      log('   ℹ️ All .js files found in src/html/ were already processed (as inline extractions).');
    }
  } catch (overallError) {
    logError('❌ One or more JS files from src/html/ failed to minify/write.', overallError.message || overallError);
    throw overallError;
  }
}


/**
 * Compiles and minifies CSS using the 'npm run build:css' script.
 * @async
 * @throws {Error} If CSS processing fails.
 */
async function compileAndMinifyCss() {
  logStep('5. Compiling and Minifying CSS (using npm run build:css)');
  try {
    log(`   Executing \`npm run build:css\` with NODE_ENV=${process.env.NODE_ENV}`);
    execSync('npm run build:css', { stdio: 'inherit', cwd: projectRootDir, env: process.env });
    log('   ✅ CSS compilation and minification complete.');
  } catch (error) {
    logError('CSS processing (npm run build:css) failed.', error);
    throw error;
  }
}

/**
 * Optimizes images from 'src/assets/images/' and copies them to 'dist/assets/images/'.
 * @async
 */
async function optimizeAndCopyImages() {
  logStep('6. Optimizing and Copying Images');
  try {
    const sourceImageFiles = globSync('**/*.{jpg,jpeg,png,gif,svg,webp,json}', { cwd: SRC_ASSETS_IMAGES_DIR, absolute: true, nodir: true });

    if (sourceImageFiles.length === 0) {
      log('   ⚠️ No image files found in src/assets/images/ to process.');
      return;
    }
    log(`   Found ${sourceImageFiles.length} image file(s) to process.`);

    // Dynamically import imagemin and its plugins
    const imagemin = (await import('imagemin')).default;
    const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
    const imageminPngquant = (await import('imagemin-pngquant')).default;
    const imageminGifsicle = (await import('imagemin-gifsicle')).default;
    const imageminSvgo = (await import('imagemin-svgo')).default;

    const plugins = [
      // imageminMozjpeg({ quality: 75 }), // Uncomment and adjust quality as needed
      // imageminPngquant({ quality: [0.65, 0.8] }), // Uncomment and adjust quality as needed
      // imageminGifsicle({ optimizationLevel: 2 }), // Uncomment and adjust optimization level as needed
      imageminSvgo(),  // Testing SVGO first as it was named in an error
    ];

    let processedCount = 0;
    for (const srcImageFile of sourceImageFiles) {
      const relativePath = path.relative(SRC_ASSETS_IMAGES_DIR, srcImageFile);
      const destPath = path.join(DIST_ASSETS_IMAGES_DIR, relativePath);
      const destDir = path.dirname(destPath);

      try {
        await fs.ensureDir(destDir);
        // imagemin processes files and returns an array of {data, sourcePath, destinationPath}
        // We want to process one file and output it to a specific directory
        const processedFiles = await imagemin([srcImageFile.replace(/\\/g, '/')], { // Ensure forward slashes for imagemin
          destination: destDir.replace(/\\/g, '/'), // imagemin needs forward slashes for destination
          plugins,
        });

        if (processedFiles && processedFiles.length > 0) {
          // fs.writeFile(destPath, processedFiles[0].data); // This was writing the file again, imagemin already does with destination
          log(`     ✅ Optimized and copied: ${path.relative(projectRootDir, srcImageFile)} -> ${path.relative(projectRootDir, processedFiles[0].destinationPath)}`);
          processedCount++;
        } else {
          // If imagemin doesn't optimize (e.g., SVG already minified), it might return an empty array or not write.
          // Fallback to simple copy if no file was written by imagemin to the destination.
          // This can happen if imagemin determines the file can't be optimized further.
          if (!await fs.pathExists(destPath)) {
            await fs.copy(srcImageFile, destPath);
            log(`     ⚠️ Image not optimized by imagemin (or no output), copied directly: ${path.relative(projectRootDir, destPath)}`);
          } else {
             log(`     ℹ️ Image at ${path.relative(projectRootDir, destPath)} likely already optimized or handled by imagemin.`);
          }
        }
      } catch (fileError) {
        logError(` ❌ Failed to process image: ${path.relative(projectRootDir, srcImageFile)}`, fileError);
        // Fallback: copy the original image if optimization fails
        try {
          await fs.ensureDir(destDir);
          await fs.copy(srcImageFile, destPath);
          log(`     ↪️ Copied (unoptimized) due to error: ${path.relative(projectRootDir, destPath)}`);
        } catch (copyError) {
          logError(` ❌ Failed to even copy original image after error: ${path.relative(projectRootDir, srcImageFile)}`, copyError);
        }
      }
    }

    if (processedCount > 0) {
      log(`   ✅ Successfully processed and copied ${processedCount} of ${sourceImageFiles.length} images with structure preservation.`);
    } else if (sourceImageFiles.length > 0) {
      log(`   ⚠️ No images were explicitly optimized by imagemin, but all were copied (either by imagemin or fallback). Check logs for details.`);
    }

  } catch (error) {
    logError(' ❌ Overall image optimization and copying failed.', error);
    log('   Build will continue, but images may not be optimized or copied.');
    // Decide if this should be a fatal error: throw error;
  }
}

/**
 * Copies static root files (e.g., robots.txt, sitemap.xml) from 'src/' to 'dist/'.
 * @async
 * @throws {Error} If copying static files fails.
 */
async function copyStaticRootFiles() {
  logStep('7. Copying Static Root Files');
  const staticFilesToCopy = [
    { src: SRC_ROBOTS_TXT, dest: DIST_ROBOTS_TXT, name: 'robots.txt' },
    { src: SRC_SITEMAP_XML, dest: DIST_SITEMAP_XML, name: 'sitemap.xml' },
    // Add other static files here if needed
  ];

  for (const file of staticFilesToCopy) {
    try {
      if (await fs.pathExists(file.src)) {
        await fs.copy(file.src, file.dest, { overwrite: true });
        log(`   ✅ Copied ${file.name} to ${file.dest}`);
      } else {
        log(`   ⚠️ Source ${file.name} not found at ${file.src}, skipping.`);
      }
    } catch (error) {
      logError(`Failed to copy ${file.name}.`, error);
      throw error; // Re-throw to make it a build-stopping error
    }
  }
  log('   ✅ Static root files copied (if found).');
}

// --- Main Orchestration ---
/**
 * Main function to orchestrate the entire production build.
 * @async
 */
async function buildProduction() {
  log('🚀🚀🚀 Starting Production Build Process 🚀🚀🚀');
  const overallStartTime = Date.now();

  try {
    await cleanDistDirectory();
    const refactorResults = await processHtmlAndExtractData();
    await minifyAndWriteHtml(refactorResults);

    const processedJsDistPaths = new Set(); // Initialize the set
    await minifyAndWriteExtractedJs(refactorResults, processedJsDistPaths);
    await minifyAndCopySrcHtmlJsFiles(processedJsDistPaths); // Call the new function

    await compileAndMinifyCss();
    await optimizeAndCopyImages();
    await copyStaticRootFiles();

    const duration = (Date.now() - overallStartTime) / 1000;
    console.log('=====================================================================================================');
    console.log('=====================================================================================================');
    log(`    🏁 🏁 🏁 Production Build Successfully Completed in ${duration.toFixed(2)}s 🏁 🏁 🏁`);
    console.log('=====================================================================================================');
    console.log('=====================================================================================================');
    log(`   Output directory: ${DIST_DIR}`);
  } catch (error) {
    console.log('===============================================================================================================');
    console.log('===============================================================================================================');
    logError('☠️  ☠️  ☠️   PRODUCTION BUILD FAILED!   ☠️  ☠️  ☠️', error.message ? error.message : error);
    console.log('===============================================================================================================');
    console.log('===============================================================================================================');
    if (error.stack && error.message) console.error(error.stack.substring(error.message.length)); // Log stack without redundant message
    process.exit(1);
  }
}

// Execute the build
buildProduction();
