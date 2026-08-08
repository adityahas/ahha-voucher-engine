#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROBE="$ROOT/apps/product-consumer/src/_guardrail_probe.ts"
MESSAGE="Loyalty must be called through its HTTP API only."

cleanup() {
  rm -f "$PROBE"
}
trap cleanup EXIT

cat > "$PROBE" <<'EOF'
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
EOF

OUTPUT="$(npx eslint "$PROBE" 2>&1 || true)"
if grep -qF "$MESSAGE" <<< "$OUTPUT"; then
  echo "[guardrail] PASS: direct @core/loyalty import is flagged by no-restricted-imports"
else
  echo "[guardrail] FAIL: no-restricted-imports did not flag a direct @core/loyalty import"
  echo "--- eslint output ---"
  echo "$OUTPUT"
  exit 1
fi