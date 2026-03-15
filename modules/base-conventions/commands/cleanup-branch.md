# Cleanup Branch

Prepare a branch for pull request by cleaning up commits, removing debug code, and verifying readiness.

## Process

### 1. Review All Changes on the Branch

```bash
# See all commits since branching from main
git log main..HEAD --oneline

# See the full diff against main
git diff main...HEAD
```

Review the diff for issues described in the review-changes command.

### 2. Remove Debug Code

Search the diff for and remove:
- `console.log` / `console.debug` / `debugger` statements
- Hardcoded test values or credentials
- Commented-out code blocks
- Temporary workarounds without documentation

### 3. Verify TODOs Are Tracked

For any `TODO` or `FIXME` comments in the diff:
- Ensure each has a ticket reference: `// TODO(PROJ-123): description`
- If there's no ticket, either create one or resolve the TODO now
- Remove any TODOs that were already resolved

### 4. Clean Up Commit History

If there are fixup or work-in-progress commits:

```bash
# Interactive rebase to squash/reword commits
git rebase -i main
```

Guidelines:
- Squash fixup commits into their parent
- Reword vague messages ("fix stuff", "wip") to follow Conventional Commits format
- Keep the history logical: one commit per logical change
- Every commit should build and pass tests independently

### 5. Verify the Branch

```bash
# Ensure all tests pass
npm test

# Ensure the branch is up to date with main
git fetch origin main
git rebase origin/main
```

### 6. Final Checklist

- [ ] No debug code (console.log, debugger, test credentials)
- [ ] No commented-out code blocks
- [ ] All TODOs have ticket references
- [ ] Commit messages follow Conventional Commits format
- [ ] Tests pass
- [ ] Branch is rebased on latest main
- [ ] No unrelated changes mixed in
