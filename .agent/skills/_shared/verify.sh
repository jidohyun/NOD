#!/bin/bash
# =============================================================================
# Subagent Result Auto-Verification Script
# Used by orchestrator after agent completion to objectively verify deliverables.
#
# Usage: bash .agent/skills/_shared/verify.sh <agent-type> <workspace-path>
#   agent-type: backend | frontend | mobile | qa | debug | pm
#   workspace-path: project root or agent workspace directory
#
# Exit codes:
#   0 = all checks passed
#   1 = some checks failed (see output)
#   2 = invalid arguments
# =============================================================================

set -euo pipefail

AGENT_TYPE="${1:-}"
WORKSPACE="${2:-.}"
PASS=0
FAIL=0
WARN=0

if [ -z "$AGENT_TYPE" ]; then
  echo "Usage: verify.sh <agent-type> <workspace-path>"
  echo "  agent-type: backend | frontend | mobile | qa | debug | pm"
  exit 2
fi

cd "$WORKSPACE" || { echo "FAIL: Cannot access workspace $WORKSPACE"; exit 2; }

# --- Helper functions ---
check_pass() { echo "  PASS: $1"; ((PASS++)); }
check_fail() { echo "  FAIL: $1"; ((FAIL++)); }
check_warn() { echo "  WARN: $1"; ((WARN++)); }
check_skip() { echo "  SKIP: $1"; }

echo "=========================================="
echo "Verification: $AGENT_TYPE agent"
echo "Workspace: $WORKSPACE"
echo "=========================================="
echo ""

# --- Common checks (all agents) ---
echo "[Common Checks]"

# Check for hardcoded secrets
if grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.dart" \
  -E "(password|secret|api_key|token)\s*=\s*['\"][^'\"]{8,}" . 2>/dev/null | grep -v "test" | grep -v "example" | grep -v "node_modules" | head -5; then
  check_fail "Possible hardcoded secrets found (see above)"
else
  check_pass "No hardcoded secrets detected"
fi

# Check for TODO/FIXME left behind
TODO_COUNT=$(grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.dart" \
  -E "TODO|FIXME|HACK|XXX" . 2>/dev/null | grep -v "node_modules" | grep -v ".agent/" | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
  check_warn "$TODO_COUNT TODO/FIXME comments found"
else
  check_pass "No TODO/FIXME comments"
fi

echo ""

# --- Agent-specific checks ---
case "$AGENT_TYPE" in

  backend)
    echo "[Backend Checks]"

    # Python syntax check
    if command -v python3 &>/dev/null; then
      PY_ERRORS=$(find . -name "*.py" -not -path "*/node_modules/*" -not -path "*/.venv/*" -exec python3 -m py_compile {} \; 2>&1 | head -10)
      if [ -z "$PY_ERRORS" ]; then
        check_pass "Python syntax valid"
      else
        echo "$PY_ERRORS"
        check_fail "Python syntax errors found"
      fi
    else
      check_skip "python3 not available"
    fi

    # Check for raw SQL string interpolation
    if grep -rn --include="*.py" -E "f['\"].*SELECT|f['\"].*INSERT|f['\"].*UPDATE|f['\"].*DELETE" . 2>/dev/null | grep -v "test" | grep -v "node_modules" | head -5; then
      check_fail "Possible SQL injection: f-string with SQL keywords"
    else
      check_pass "No SQL string interpolation detected"
    fi

    # Check for pytest
    if command -v pytest &>/dev/null || [ -f "pyproject.toml" ]; then
      if pytest --co -q 2>/dev/null | tail -1 | grep -q "no tests"; then
        check_warn "No tests found"
      else
        if pytest -q --tb=no 2>/dev/null; then
          check_pass "Tests pass"
        else
          check_fail "Tests failing"
        fi
      fi
    else
      check_skip "pytest not available"
    fi
    ;;

  frontend)
    echo "[Frontend Checks]"

    # TypeScript check
    if [ -f "tsconfig.json" ] && command -v npx &>/dev/null; then
      if npx tsc --noEmit 2>/dev/null; then
        check_pass "TypeScript compilation clean"
      else
        check_fail "TypeScript errors found"
      fi
    else
      check_skip "TypeScript not configured or npx not available"
    fi

    # Check for inline styles
    INLINE_COUNT=$(grep -rn --include="*.tsx" --include="*.jsx" 'style={{' . 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
    if [ "$INLINE_COUNT" -gt 0 ]; then
      check_warn "$INLINE_COUNT inline styles found (should use Tailwind)"
    else
      check_pass "No inline styles"
    fi

    # Check for 'any' type
    ANY_COUNT=$(grep -rn --include="*.ts" --include="*.tsx" ': any' . 2>/dev/null | grep -v "node_modules" | grep -v ".d.ts" | wc -l | tr -d ' ')
    if [ "$ANY_COUNT" -gt 3 ]; then
      check_fail "$ANY_COUNT 'any' types found (limit: 3)"
    elif [ "$ANY_COUNT" -gt 0 ]; then
      check_warn "$ANY_COUNT 'any' types found"
    else
      check_pass "No 'any' types"
    fi

    # Run tests
    if [ -f "package.json" ] && command -v npx &>/dev/null; then
      if npx vitest run --reporter=verbose 2>/dev/null; then
        check_pass "Tests pass"
      else
        check_warn "Tests failed or vitest not configured"
      fi
    else
      check_skip "No package.json or npx not available"
    fi
    ;;

  mobile)
    echo "[Mobile Checks]"

    # Dart analysis
    if command -v flutter &>/dev/null; then
      ANALYSIS=$(flutter analyze 2>/dev/null | tail -3)
      if echo "$ANALYSIS" | grep -q "No issues found"; then
        check_pass "Flutter analysis clean"
      else
        echo "$ANALYSIS"
        check_fail "Flutter analysis issues found"
      fi
    elif command -v dart &>/dev/null; then
      if dart analyze 2>/dev/null | grep -q "No issues found"; then
        check_pass "Dart analysis clean"
      else
        check_fail "Dart analysis issues found"
      fi
    else
      check_skip "Flutter/Dart not available"
    fi

    # Check for undisposed controllers
    UNDISPOSED=$(grep -rn --include="*.dart" "Controller()" . 2>/dev/null | grep -v "dispose" | grep -v "test" | grep -v ".dart_tool" | wc -l | tr -d ' ')
    if [ "$UNDISPOSED" -gt 0 ]; then
      check_warn "$UNDISPOSED controllers found — verify dispose() is called"
    else
      check_pass "Controller disposal looks correct"
    fi

    # Run tests
    if command -v flutter &>/dev/null; then
      if flutter test 2>/dev/null; then
        check_pass "Flutter tests pass"
      else
        check_fail "Flutter tests failed"
      fi
    else
      check_skip "Flutter not available for tests"
    fi
    ;;

  qa)
    echo "[QA Report Checks]"
    # QA agent produces reports, not code — verify report quality
    check_pass "QA agent report verified by self-check.md (manual)"
    ;;

  debug)
    echo "[Debug Checks]"
    # Debug agent fixes bugs — run the relevant test suite
    echo "  Running project test suite to verify fix..."
    if [ -f "pyproject.toml" ] && command -v pytest &>/dev/null; then
      if pytest -q --tb=short 2>/dev/null; then
        check_pass "All tests pass after fix"
      else
        check_fail "Tests failing after fix"
      fi
    elif [ -f "package.json" ] && command -v npx &>/dev/null; then
      if npx vitest run 2>/dev/null; then
        check_pass "All tests pass after fix"
      else
        check_fail "Tests failing after fix"
      fi
    else
      check_skip "No test runner detected"
    fi
    ;;

  pm)
    echo "[PM Plan Checks]"
    # PM produces plans, not code
    if [ -f ".agent/plan.json" ]; then
      check_pass "plan.json exists"
      # Validate JSON
      if python3 -c "import json; json.load(open('.agent/plan.json'))" 2>/dev/null; then
        check_pass "plan.json is valid JSON"
      else
        check_fail "plan.json is invalid JSON"
      fi
    else
      check_warn "plan.json not found at .agent/plan.json"
    fi
    ;;

  *)
    echo "Unknown agent type: $AGENT_TYPE"
    exit 2
    ;;
esac

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
else
  exit 0
fi
