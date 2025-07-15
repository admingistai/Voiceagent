#!/usr/bin/env python3
"""
Test script to verify Deepgram API connectivity
"""
import os
import asyncio
import requests
from dotenv import load_dotenv

# Load environment variables from agent directory
import os
if os.path.exists("agent/.env"):
    load_dotenv("agent/.env")
elif os.path.exists(".env"):
    load_dotenv(".env")
else:
    load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

def test_deepgram_api_key():
    """Test if Deepgram API key is valid"""
    if not DEEPGRAM_API_KEY:
        print("❌ DEEPGRAM_API_KEY not found in environment variables")
        return False
    
    print(f"✅ DEEPGRAM_API_KEY found: {DEEPGRAM_API_KEY[:10]}...")
    
    # Test API key by making a simple request to Deepgram
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test with a simple project list request
        response = requests.get(
            "https://api.deepgram.com/v1/projects",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Deepgram API key is valid and working")
            projects = response.json()
            print(f"Found {len(projects.get('projects', []))} projects")
            return True
        else:
            print(f"❌ Deepgram API request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error connecting to Deepgram: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

async def test_deepgram_plugin():
    """Test the LiveKit Deepgram plugin"""
    try:
        from livekit.plugins import deepgram
        print("✅ LiveKit Deepgram plugin imported successfully")
        
        # Try to create a Deepgram STT instance
        stt = deepgram.STT()
        print("✅ Deepgram STT instance created successfully")
        
        # Test basic configuration
        print(f"Deepgram STT model: {getattr(stt, 'model', 'default')}")
        print(f"Deepgram STT language: {getattr(stt, 'language', 'en')}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import Deepgram plugin: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to create Deepgram STT instance: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Deepgram Configuration")
    print("=" * 50)
    
    # Test 1: API Key
    print("\n1. Testing Deepgram API Key...")
    api_key_valid = test_deepgram_api_key()
    
    # Test 2: Plugin
    print("\n2. Testing LiveKit Deepgram Plugin...")
    plugin_result = asyncio.run(test_deepgram_plugin())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"API Key Valid: {'✅' if api_key_valid else '❌'}")
    print(f"Plugin Working: {'✅' if plugin_result else '❌'}")
    
    if api_key_valid and plugin_result:
        print("\n🎉 All tests passed! Deepgram should work correctly.")
        return True
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)