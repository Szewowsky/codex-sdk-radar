#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROFILE_SOURCE="$SCRIPT_DIR/radar-bwrap.apparmor"
PROFILE_TARGET=/etc/apparmor.d/radar-bwrap

if [ ! -f "$PROFILE_SOURCE" ]; then
  echo "AppArmor profile not found: $PROFILE_SOURCE" >&2
  exit 1
fi

if [ -e "$PROFILE_TARGET" ] && ! cmp -s "$PROFILE_SOURCE" "$PROFILE_TARGET"; then
  echo "A different $PROFILE_TARGET already exists; inspect it before replacing." >&2
  exit 1
fi

sudo install -m 0644 "$PROFILE_SOURCE" "$PROFILE_TARGET"
sudo apparmor_parser -Kr "$PROFILE_TARGET"
echo "Loaded AppArmor profile radar-bwrap."
echo "Dalej, w folderze appki: docker compose up -d --build"
