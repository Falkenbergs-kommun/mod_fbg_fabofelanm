#!/bin/bash
# Script to copy and convert components from felanmalan-mock

SOURCE_DIR="../../felanmalan/felanmalan-mock"
DEST_DIR="./src"

# Create directories
mkdir -p "$DEST_DIR/components"
mkdir -p "$DEST_DIR/lib"

# Copy components
echo "Copying components from $SOURCE_DIR..."

# Copy component files
for file in "$SOURCE_DIR/components"/{ReportForm,ReportStatus,Combobox,Header}.tsx; do
  if [ -f "$file" ]; then
    basename=$(basename "$file" .tsx)
    echo "Converting $basename.tsx -> $basename.jsx"

    # Copy and do basic TypeScript removal
    sed -E \
      -e "s/: React\.[A-Za-z<>]+//g" \
      -e "s/: [A-Za-z]+(\[\])?//g" \
      -e "/^import type /d" \
      -e "/^interface /,/^}/d" \
      -e "s/<[A-Za-z]+(\[\])?>//g" \
      -e "s/'use client';//g" \
      -e "s/@\/lib/\.\.\/lib/g" \
      -e "s/from '\.\/([A-Za-z]+)'/from '.\/components\/\1'/g" \
      "$file" > "$DEST_DIR/components/${basename}.jsx"
  fi
done

# Copy lib helpers
if [ -f "$SOURCE_DIR/lib/fastaStrukturenStore.ts" ]; then
  echo "Converting fastaStrukturenStore.ts -> fastaStrukturenStore.js"
  sed -E \
    -e "s/: [A-Za-z]+(\[\])?//g" \
    -e "/^export (interface|type) /,/^}/d" \
    "$SOURCE_DIR/lib/fastaStrukturenStore.ts" > "$DEST_DIR/lib/fastaStrukturenStore.js"
fi

echo "Done! Components copied to $DEST_DIR"
echo "Note: Manual fixes may be needed for complex types"
