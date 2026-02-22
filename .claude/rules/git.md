---
description: Git commit conventions for this project. Apply when creating commits.
---

# Git Commit Rules

1. **Never add Co-Authored-By lines.** Do not append `Co-Authored-By: Claude ...` or any AI attribution to commit messages.

2. **Use the release format** for all commits:
   ```
   Release v1.x.x: short summary

   - change 1
   - change 2
   - ...
   ```

3. **Version bumping**: increment the patch version (v1.1.x) for fixes and small changes, minor version (v1.x.0) for new features.
