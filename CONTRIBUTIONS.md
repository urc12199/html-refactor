
---

# Contributing to HTML Refactor (`html-refactor`)
(Create directory `.github/ISSUE_TEMPLATE/` in your root, then place this file inside `ISSUE_TEMPLATE`)

First off, thank you for considering contributing to `html-refactor`! We welcome any contributions that help improve this tool for the community. Whether it's reporting a bug, discussing new features, or submitting code changes, your help is appreciated.

This document provides guidelines for contributing to this project. Please read it carefully to ensure a smooth and effective contribution process.

## Table of Contents

-   [Code of Conduct](#code-of-conduct)
-   [Ways to Contribute](#ways-to-contribute)
    -   [Reporting Bugs](#reporting-bugs)
    -   [Suggesting Enhancements](#suggesting-enhancements)
    -   [Submitting Code Changes](#submitting-code-changes)
-   [Setting Up Your Development Environment](#setting-up-your-development-environment)
-   [Making Changes (Code Contributions)](#making-changes-code-contributions)
    -   [Creating a Branch](#creating-a-branch)
    -   [Coding Style](#coding-style)
    -   [Commit Message Guidelines](#commit-message-guidelines)
    -   [Testing](#testing)
    -   [Updating Documentation](#updating-documentation)
-   [Submitting a Pull Request (PR)](#submitting-a-pull-request-pr)
    -   [PR Checklist](#pr-checklist)
    -   [What Happens After Submitting?](#what-happens-after-submitting)
-   [NPM Release Process (For Maintainers)](#npm-release-process-for-maintainers)
-   [Questions or Need Help?](#questions-or-need-help)

## Code of Conduct

While we don’t have an official `CODE_OF_CONDUCT.md` in place just yet, but we still ask every contributor to engage with courtesy and positivity. Treat everyone—no matter their skill level or background—with respect. Harassment or exclusionary behavior is unacceptable. What's more important than any file full of rules and regulations is choosing to behave honorably, show kindness, and act with integrity and righteousness in everything you do and say. Karma hits back and it hits hard.

## Ways to Contribute

### Reporting Bugs

If you find a bug, please ensure it hasn't already been reported by searching the [Issues](https://github.com/RuthvikUpputuri/html-refactor/issues) section on GitHub.

**Before Submitting a Bug Report:**

*   **Verify the bug:** Ensure the issue is reproducible with the latest version of `html-refactor`.
*   **Gather information:** Collect details about your environment (OS, Node.js version, npm version, `html-refactor` version) and the exact steps to reproduce the bug.
*   **Check configuration:** Review your `href.config.json` to ensure it's not a misconfiguration causing the issue.

**How to Submit a Good Bug Report:**

Use the "Bug report" template provided when you create a new issue. If the template isn't available, please include:
*   A clear and descriptive title (e.g., "Error when extracting JS from HTML with X structure").
*   A detailed description of the bug.
*   Step-by-step instructions to reproduce the bug.
*   What you expected to happen.
*   What actually happened (include error messages, logs, or screenshots if applicable).
*   Your environment details (OS, Node.js, npm, `html-refactor` version).
*   Relevant parts of your `href.config.json` (please redact any sensitive information).
*   A minimal, reproducible example of the HTML file causing the issue, if possible.

### Suggesting Enhancements

We welcome suggestions for new features or improvements to existing functionality!

**Before Submitting an Enhancement Suggestion:**

*   **Check for existing requests:** Search the [Issues](https://github.com/RuthvikUpputuri/html-refactor/issues) to see if a similar enhancement has already been proposed.
*   **Consider the scope:** Think about how the enhancement fits into the overall goals of `html-refactor`.

**How to Submit a Good Enhancement Suggestion:**

Use the "Feature request" template provided when you create a new issue. If the template isn't available, please include:
*   A clear and descriptive title (e.g., "Add support for extracting styles from specific CSS custom properties").
*   A detailed explanation of the proposed enhancement.
*   The problem this enhancement would solve or the value it would add.
*   Any alternative solutions or features you've considered.
*   Potential use cases or examples of how this feature would be used.

### Submitting Code Changes

If you'd like to contribute code, please follow the process outlined below.

## Setting Up Your Development Environment

1.  **Fork the repository:** Click the "Fork" button on the [html-refactor GitHub page](https://github.com/RuthvikUpputuri/html-refactor).
2.  **Clone your fork:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/html-refactor.git
    cd html-refactor
    ```
3.  **Install Node.js and npm:** Ensure you have Node.js (v14.x or later recommended) and npm installed. You can check with `node -v` and `npm -v`.
4.  **Install dependencies:**
    ```bash
    npm install
    ```
5.  **Link for local testing (optional but recommended):**
    To test your local changes using the `html-refactor`, `href`, or `htref` commands globally without publishing, you can link your local package:
    ```bash
    npm link
    ```
    Now, when you run `html-refactor` in any test project, it will use your local development version.
    To unlink later: `npm unlink html-refactor` (you might need to do this from the `html-refactor` project directory itself, or use `npm unlink` then `npm install -g html-refactor` to get the published version back).

## Making Changes (Code Contributions)

### Creating a Branch

Create a new branch for your feature or bug fix from the `main` branch (or the current development branch if specified):

```bash
git checkout main
git pull origin main # Ensure your main is up-to-date
git checkout -b feature/your-feature-name  # For new features
# or
git checkout -b fix/bug-description       # For bug fixes
```

Please use descriptive branch names (e.g., feature/add-tsx-support, fix/resolve-path-issue-windows).

### Coding Style

* **JavaScript:** Follow the existing coding style in refactor-html.js.
  * Use JSDoc comments for functions and important code blocks.
  * Ensure code is readable and well-commented, especially for complex logic.
  * Currently, the project uses CommonJS modules (require/module.exports).
* **Linters/Formatters:** While not formally enforced with pre-commit hooks yet, aim for consistency. (Future: ESLint and Prettier might be added).

### Commit Message Guidelines

Strive for clear and concise commit messages. We encourage a format similar to Conventional Commits:

* **Format:** `<type>(<scope>): <short summary>`
  * `<type>: feat (new feature)`, fix (bug fix), docs (documentation), style (formatting, missing semicolons, etc.), refactor, test, chore (build process, dependency updates).
  * <scope> (optional): The part of the codebase affected (e.g., config, css-extraction, cli).
  * <short summary>: Imperative mood, present tense (e.g., "Add new option" not "Added new option" or "Adds new option").
* **Body (optional):** Provide more details if needed, separated by a blank line after the summary.
* **Footer (optional):** For breaking changes (use BREAKING CHANGE:) or issue linking (Closes #123).

**Example**

```bash
feat(cli): add --verbose option for detailed output

This commit introduces a new '--verbose' flag that enables
more detailed logging during the refactoring process.

Closes #42
```

### Testing
* **Current State:** The project currently relies on manual testing using the test_env/ setup.
* **Making Changes:**
    * Thoroughly test your changes locally against various scenarios using the test_env/index.html and other test HTML files you might create.
    * Consider edge cases.
* **Adding Tests (Future):** If you're adding significant new functionality, consider if unit tests or integration tests would be beneficial. (Future: A test runner like Jest might be introduced). For now, describe your manual testing steps in your PR.

### Updating Documentation
If your changes affect user-facing behavior, CLI options, or the configuration, please update the relevant sections in:
* `README.md`
* JSDoc comments within `refactor-html.js` if internal logic changes significantly.

## Submitting a Pull Request (PR)
Once you're satisfied with your changes:

1. **Push your branch to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
   
2. **Open a Pull Request:** Go to the [html-refactor GitHub repository]( https://github.com/RuthvikUpputuri/html-refactor) and click `New pull request`.
   Choose your fork and branch to compare with the main branch of the original repository.

3. **Fill out the PR template:** Provide a clear title and description for your PR. Explain the "why" and "what" of your changes. Link to any relevant issues.

### PR Checklist

Before submitting your PR, please ensure you've done the following:

* [ ] Read CONTRIBUTING.md (this file!).
* [ ] Your code follows the project's coding style.
* [ ] You've performed a self-review of your code.
* [ ] You've added clear comments, especially for complex parts.
* [ ] You've updated documentation (README.md, JSDoc) if necessary.
* [ ] Your changes don't introduce new linting errors or warnings (if applicable).
* [ ] You've tested your changes thoroughly.
* [ ] Your commit messages are descriptive.
* [ ] You've created the PR against the correct branch (usually main).

### What Happens After Submitting?
* **Review:** A maintainer will review your PR. They may ask questions or request changes.

* **Discussion:** Engage in the discussion and address any feedback. You can push further commits to your branch to update the PR.

* **Merge:** Once the PR is approved and passes any checks, a maintainer will merge it.

  ***Thank you for your contribution!***

## NPM Release Process (For Maintainers)

This section outlines the steps for publishing a new version of html-refactor to NPM.

**Prerequisites:**
* You must be an owner/collaborator on the `html-refactor` NPM package.
* You must be logged into npm: `npm login`
* Ensure your local `main` branch is up-to-date with `origin/main`.

**Steps:**

1. **Pre-Release Checks:**
    * Ensure all tests (manual or automated) are passing.
    * Verify all relevant documentation (`README.md`, `JSDoc comments`) is updated.
    * Check that `CONTRIBUTING.md` is current.
    * Confirm that `package.json`'s version is correct for the current published version (you'll update it next).
    * Ensure the `CHANGELOG.md` (if one is maintained OR you can create and contribute) is updated with changes for the new release.

2. **Ensure a Clean Working Directory:**
   ```bash
   git status # Should show 'nothing to commit, working tree clean'
   ```

3. **Bump the Version:**

    Use `npm version` to update `package.json`, create a version commit, and tag it.
    
      * For a patch release (bug fixes): `npm version patch` (e.g., 1.0.0 -> 1.0.1)
      * For a minor release (new non-breaking features): `npm version minor` (e.g., 1.0.1 -> 1.1.0)
      * For a major release (breaking changes): `npm version major` (e.g., 1.1.0 -> 2.0.0)
    
      This command will:
      * Update the version in `package.json`.
      * Create a commit like "v1.0.1".
      * Create a Git tag like "v1.0.1".

4. **Push Changes and Tags to GitHub:**
   ```bash
   git push origin main --tags
    # or if you are on a different release branch:
    # git push origin your-release-branch --tags
    ```

5. **Publish to NPM:**
   ```bash
   npm publish
   ```
    If you use two-factor authentication (2FA) on NPM, you might be prompted for an OTP:
    ```bash
    npm publish --otp=YOUR_OTP_CODE
    ```

6. **Create a GitHub Release:**
    * Go to the "**Releases**" section of your GitHub repository.
    * Click "**Draft a new release**".
    * **Tag version:** Select the tag you just pushed (e.g., v1.0.1).
    * **Release title:** Typically the same as the tag (e.g., v1.0.1).
    * **Describe this release:** Summarize the key changes, bug fixes, and new features. You can often copy this from your `CHANGELOG.md`. Link to important PRs or issues.
    * Click "Publish release".

7. **Post-Release (Optional):**
    * Announce the new release (e.g., Twitter, project chat).
    * If you had a release branch, merge it back into `main` if necessary.

## Questions or Need Help?
  
  If you have questions about contributing, encounter issues with the setup, or need clarification on any part of this process, please feel free to [open an issue](https://github.com/RuthvikUpputuri/html-refactor/issues) and label it as a *"question"*.

---

### 🎉***Thank you for making html-refactor better!*** 🙏

---