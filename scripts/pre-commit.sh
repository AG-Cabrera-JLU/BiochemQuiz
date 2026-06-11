#!/bin/sh
# BiochemQuiz pre-commit hook
# 1. Validates question files are in sync across EN/DE/ES
# 2. Bumps package.json patch version and re-stages it

node scripts/check-questions.js || exit 1

npm version patch --no-git-tag-version --no-workspaces-update 2>/dev/null
git add package.json
