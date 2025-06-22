
---

**4. `.github/PULL_REQUEST_TEMPLATE.md`**
   (Place this file directly inside the `.github/` directory)

```markdown
-----------------------------------------------------------------------

<!--
Thank you for contributing to html-refactor!

Please provide a clear and concise description of your changes below.
Link to any relevant issues if applicable.
Ensure you have read CONTRIBUTING.md and completed the checklist.
-->

-----------------------------------------------------------------------
```

## Description

Please include a summary of the change and which issue is fixed or which feature is implemented.
Provide context and rationale for the changes.

## Related Issue(s)

*   Fixes # (issue number)
*   Closes # (issue number)
*   Addresses # (issue number)
    *(Use "Fixes" or "Closes" to automatically close the issue when the PR is merged)*

## Type of change

Please check the relevant option(s).
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
    *If this is a breaking change, please describe the impact and migration path for existing users below.*
- [ ] Refactor (non-breaking change that neither fixes a bug nor adds a feature)
- [ ] Chore (e.g., build process, documentation, or dependency updates)
- [ ] Documentation update

## How Has This Been Tested?

Please describe the tests that you ran to verify your changes.
- [ ] Manually tested with `test_env/index.html` and other custom HTML files.
- [ ] Tested different configurations in `href.config.json`.
- [ ] (If applicable) Added new test cases to `test_env/` or other test suites.
- [ ] (If applicable) All existing tests pass.

Provide instructions so we can reproduce. Please also list any relevant details for your test configuration.
**Example:**
1. Configured `href.config.json` with `jsOutputDirStrategy: "centralized"`.
2. Ran `html-refactor --dry-run` on `test_env/index.html`.
3. Verified logs showed correct path for centralized JS output.*

## Checklist:

*   [ ] I have read the [**CONTRIBUTING.md**](https://github.com/RuthvikUpputuri/html-refactor/blob/main/CONTRIBUTING.md) document.
*   [ ] My code follows the style guidelines of this project.
*   [ ] I have performed a self-review of my own code.
*   [ ] I have commented my code, particularly in hard-to-understand areas.
*   [ ] I have made corresponding changes to the documentation (`README.md`, JSDoc, etc.).
*   [ ] My changes generate no new warnings.
*   [ ] I have added tests that prove my fix is effective or that my feature works (if applicable).
*   [ ] New and existing unit tests pass locally with my changes (if applicable).
*   [ ] Any dependent changes have been merged and published in downstream modules (if applicable).
*   [ ] My commit messages are clear and follow the project's guidelines.

## Screenshots (if applicable for UI changes or visual bugs)
```
<!-- If your change is visual, please add screenshots here. -->
```
## Further comments or questions
```
<!-- Add any other comments, questions, or context here. -->
```
---
Remember to create the `.github/` directory at the root of your `html-refactor` repository,
then place `PULL_REQUEST_TEMPLATE.md` directly inside `.github/`, and create an `ISSUE_TEMPLATE/` subdirectory inside `.github/`
for `bug_report.md` and `feature_request.md`.

---

### ***Thank you again for making html-refactor better!*** 🙏

---
