---
description: Manual confirmation required - use this when you want to review commands before running
---

## Notes
This workflow does NOT have the `// turbo` annotation.
Commands in this workflow will require manual confirmation before running.

## How to switch between auto-run and manual:
- **Auto-run**: Add `// turbo-all` at the top of a workflow file
- **Manual**: Remove `// turbo-all` from the workflow file (or use this file)

## Example command (requires confirmation):
1. Run `npm install <package>` to install a new package
2. Run `rm -rf node_modules` to remove dependencies
3. Any destructive or risky operations
