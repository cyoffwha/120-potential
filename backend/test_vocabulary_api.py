#!/usr/bin/env python3
"""
Test script for vocabulary API endpoints
Run this to verify the vocabulary flashcard system is working
"""

import asyncio
import aiohttp
import json
from datetime import datetime

BACKEND_URL = "http://localhost:8079"

async def test_vocabulary_api():
    """Test all vocabulary API endpoints"""
    async with aiohttp.ClientSession() as session:
        
        print("🧪 Testing Vocabulary API Endpoints")
        print("=" * 50)
        
        # Test 1: Get all cards
        print("\n1. Testing GET /vocabulary/cards")
        try:
            async with session.get(f"{BACKEND_URL}/vocabulary/cards") as resp:
                if resp.status == 200:
                    cards = await resp.json()
                    print(f"✅ Success: Found {len(cards)} cards")
                    if cards:
                        print(f"   Sample card: {cards[0]['word']} ({cards[0]['difficulty']})")
                else:
                    print(f"❌ Failed: Status {resp.status}")
                    text = await resp.text()
                    print(f"   Error: {text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 2: Get due cards
        print("\n2. Testing GET /vocabulary/due-cards")
        try:
            async with session.get(f"{BACKEND_URL}/vocabulary/due-cards") as resp:
                if resp.status == 200:
                    due_cards = await resp.json()
                    print(f"✅ Success: Found {len(due_cards)} due cards")
                    if due_cards:
                        print(f"   Sample due card: {due_cards[0]['word']}")
                else:
                    print(f"❌ Failed: Status {resp.status}")
                    text = await resp.text()
                    print(f"   Error: {text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 3: Get stats
        print("\n3. Testing GET /vocabulary/stats")
        try:
            async with session.get(f"{BACKEND_URL}/vocabulary/stats") as resp:
                if resp.status == 200:
                    stats = await resp.json()
                    print(f"✅ Success: Stats retrieved")
                    print(f"   Total cards: {stats['total_cards']}")
                    print(f"   Completed: {stats['completed_cards']}")
                    print(f"   Due today: {stats['due_today']}")
                    print(f"   Completion: {stats['completion_percentage']:.1f}%")
                else:
                    print(f"❌ Failed: Status {resp.status}")
                    text = await resp.text()
                    print(f"   Error: {text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        # Test 4: Submit attempt (only if we have cards)
        print("\n4. Testing POST /vocabulary/submit-attempt")
        try:
            # First get a card to test with
            async with session.get(f"{BACKEND_URL}/vocabulary/due-cards") as resp:
                if resp.status == 200:
                    due_cards = await resp.json()
                    if due_cards:
                        test_card = due_cards[0]
                        
                        # Test "again" result
                        attempt_data = {
                            "card_id": test_card["id"],
                            "result": "again",
                            "time_elapsed_seconds": 5.5
                        }
                        
                        async with session.post(
                            f"{BACKEND_URL}/vocabulary/submit-attempt",
                            json=attempt_data,
                            headers={"Content-Type": "application/json"}
                        ) as resp:
                            if resp.status == 200:
                                result = await resp.json()
                                print(f"✅ Success: Attempt submitted")
                                print(f"   Result: {result['status']}")
                                print(f"   Failure count: {result['failure_count']}")
                                print(f"   Next review: {result['next_review_date']}")
                                print(f"   Interval: {result['interval_days']} days")
                            else:
                                print(f"❌ Failed: Status {resp.status}")
                                text = await resp.text()
                                print(f"   Error: {text}")
                    else:
                        print("⏭️  Skipped: No due cards available")
                else:
                    print("⏭️  Skipped: Could not get cards for testing")
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Vocabulary API test completed!")

if __name__ == "__main__":
    asyncio.run(test_vocabulary_api())
