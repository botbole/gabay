import json
import re
import sys

try:
    command = json.load(sys.stdin).get("tool_input", {}).get("command", "")
except Exception:
    sys.exit(0)

if not re.search(r"\bgit\s+(add|commit|stage)\b", command):
    sys.exit(0)

if re.search(r"(^|[\s/\\\"'])(\.env(\.(local|prod\w*|dev\w*))?|gabay\.db)(?=$|[\s\"'])", command):
    sys.stderr.write("Blocked: never stage or commit .env or gabay.db. Stage explicit non-secret paths.\n")
    sys.exit(2)

if re.search(r"\bgit\s+add\s+(-A|--all|\.)(\s|$)", command):
    sys.stderr.write("Blocked: stage explicit paths instead of `git add .`/`-A`.\n")
    sys.exit(2)
