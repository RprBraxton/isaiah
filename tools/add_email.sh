#!/bin/bash
# Add (or with --remove, remove) an email on the Isaiah app sync allowlist.
# Usage: tools/add_email.sh someone@example.com   |   tools/add_email.sh --remove someone@example.com
# Needs the Supabase Management API token in $SUPABASE_ACCESS_TOKEN or /home/box/shared/isaiah/sb_token.txt (never commit it).
set -euo pipefail
REF="${SUPABASE_PROJECT_REF:-ewkcssbwoacakcfryyld}"
MODE=add; if [ "${1:-}" = "--remove" ]; then MODE=remove; shift; fi
EMAIL=$(printf '%s' "${1:?usage: add_email.sh [--remove] email}" | tr '[:upper:]' '[:lower:]')
[[ "$EMAIL" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "invalid email"; exit 1; }
TOKEN="${SUPABASE_ACCESS_TOKEN:-$(cat /home/box/shared/isaiah/sb_token.txt)}"
if [ $MODE = add ]; then SQL="insert into public.allowed_emails(email) values ('$EMAIL') on conflict do nothing; select email from public.allowed_emails order by email;"
else SQL="delete from public.allowed_emails where email='$EMAIL'; select email from public.allowed_emails order by email;"; fi
BODY=$(python3 -c 'import json,sys;print(json.dumps({"query":sys.argv[1]}))' "$SQL")
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data "$BODY" "https://api.supabase.com/v1/projects/$REF/database/query"; echo
