#!/usr/bin/env bash
set -euo pipefail
umask 077
source_file=/var/lib/obdkodu-comments/events.jsonl
backup_dir=/var/backups/obdkodu-comments
install -d -m 700 "$backup_dir"
if [[ -f "$source_file" ]]; then
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  cp "$source_file" "$backup_dir/events-$stamp.jsonl"
fi
