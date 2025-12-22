#!/bin/bash
# Railway build script - ensures env vars are available at build time

echo "=== Build Environment Variables ==="
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-(not set)}"
echo "NEXT_PUBLIC_GOOGLE_MAP_ID: ${NEXT_PUBLIC_GOOGLE_MAP_ID:-(not set)}"
echo "==================================="

# Create .env.local if variables are set
if [ -n "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" ]; then
  echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" > .env.local
  echo "Created .env.local with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
fi

if [ -n "$NEXT_PUBLIC_GOOGLE_MAP_ID" ]; then
  echo "NEXT_PUBLIC_GOOGLE_MAP_ID=$NEXT_PUBLIC_GOOGLE_MAP_ID" >> .env.local
  echo "Added NEXT_PUBLIC_GOOGLE_MAP_ID to .env.local"
fi

# Run the actual build
npm run build
