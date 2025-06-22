
---

**2. `.github/ISSUE_TEMPLATE/bug_report.md`**
   (Create directory `.github/ISSUE_TEMPLATE/` in your root, then place this file inside `ISSUE_TEMPLATE`)

```markdown
---
name: "\U0001F41B Bug report"
about: Create a report to help us improve html-refactor
title: 'Bug: [Short description of bug]'
labels: 'bug, needs-triage'
assignees: ''
---
```

**Describe the bug:** A clear and concise description of what the bug is.

**To Reproduce:**
Steps to reproduce the behavior:
1. Go to '...'
2. Configure `href.config.json` with '....'
3. Run command `html-refactor ...` with these options '....'
4. See error '....' or observe incorrect behavior '....'


**Expected behavior:**
A clear and concise description of what you expected to happen.

**Actual behavior:**
A clear and concise description of what actually happened. Please include any error messages or console output.

**Screenshots and Logs**
If applicable, add screenshots or copy-paste relevant log snippets from the `.href-logs/` directory to help explain your problem.
*Remember to redact any sensitive information from logs or configuration files.*

**Environment (please complete the following information):**
 - **OS:** [e.g., macOS Sonoma 14.1, Windows 11, Ubuntu 22.04]
 - **Node.js version:** [e.g., v18.17.0, v20.5.0] (Run `node -v`)
 - **npm version:** [e.g., 9.8.1, 10.1.0] (Run `npm -v`)
 - **`html-refactor` version:** [e.g., v1.0.0] (Run `html-refactor --version`)
 - **`href.config.json` content (if relevant to the bug):**

```bash
   // Paste relevant parts of your href.config.json here
   // IMPORTANT: Redact any sensitive paths or information

 <!-- Paste a small, self-contained HTML snippet that demonstrates the bug -->
```

**Additional context:**

Add any other context about the problem here. For example:
    Did this work in a previous version?
    Are you using a specific CSS framework or JS library that might be interacting?

**Checklist** 

* [ ] I have searched existing issues and this is not a duplicate.
* [ ] I have provided a clear and concise description of the bug.
* [ ] I have provided steps to reproduce the bug.
* [ ] I have completed the environment information.
* [ ] If applicable, I have provided a minimal reproducible example (HTML, config).

