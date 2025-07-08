#!/usr/bin/env python3
"""
Debug script to check environment variables in Railway
Run this to see what environment variables are available
"""

import os
import sys

print("=== Environment Variable Debug ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Script location: {os.path.abspath(__file__)}")
print()

# Check specific environment variables
env_vars = [
    "RAILWAY_ENVIRONMENT",
    "PORT",
    "OPENAI_API_KEY",
    "LIVEKIT_API_KEY", 
    "LIVEKIT_API_SECRET",
    "LIVEKIT_URL",
    "DEEPGRAM_API_KEY",
    "CARTESIA_API_KEY",
    "REDIS_URL",
    "API_SECRET_KEY",
    "DEFAULT_KB_FILE",
    "ALLOWED_ORIGINS",
    "PYTHONPATH",
    "PATH"
]

print("Checking specific environment variables:")
for var in env_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if "KEY" in var or "SECRET" in var:
            masked_value = f"{value[:4]}...{value[-4:]}" if len(value) > 8 else "***"
            print(f"  {var}: {masked_value} (length: {len(value)})")
        else:
            print(f"  {var}: {value}")
    else:
        print(f"  {var}: NOT SET")

print("\n=== All Environment Variables ===")
print(f"Total environment variables: {len(os.environ)}")
print("\nNon-sensitive variables:")
for key, value in sorted(os.environ.items()):
    if not any(sensitive in key.upper() for sensitive in ["KEY", "SECRET", "TOKEN", "PASSWORD"]):
        print(f"  {key}: {value}")

# Try to import and initialize components
print("\n=== Component Import Test ===")
try:
    from dotenv import load_dotenv
    print("✓ dotenv imported successfully")
except ImportError as e:
    print(f"✗ Failed to import dotenv: {e}")

try:
    import openai
    print("✓ openai imported successfully")
except ImportError as e:
    print(f"✗ Failed to import openai: {e}")

try:
    import chromadb
    print("✓ chromadb imported successfully")
except ImportError as e:
    print(f"✗ Failed to import chromadb: {e}")

# Test OpenAI API key
print("\n=== OpenAI API Key Test ===")
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"OpenAI API key is set (length: {len(api_key)})")
    print(f"First 4 chars: {api_key[:4]}")
    print(f"Last 4 chars: {api_key[-4:]}")
else:
    print("OpenAI API key is NOT set")
    print("This will prevent the knowledge base from initializing")