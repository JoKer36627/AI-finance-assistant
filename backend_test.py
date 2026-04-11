#!/usr/bin/env python3
"""
Backend API Testing for Monefy AI Finance Tracker
Tests all critical API endpoints with demo user credentials
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class MonefyAPITester:
    def __init__(self, base_url: str = "https://fecbd816-b81c-4d49-9a0c-08bb0c1e5795.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request and return success status and response"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text, "status_code": response.status_code}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_auth_login(self):
        """Test login with demo credentials"""
        success, response = self.make_request(
            'POST', 
            '/auth/login',
            {"email": "demo@monefy.ai", "password": "DemoPass123!"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Auth Login", True)
            return True
        else:
            self.log_test("Auth Login", False, f"Response: {response}")
            return False

    def test_user_profile(self):
        """Test getting user profile"""
        success, response = self.make_request('GET', '/users/me')
        
        if success and 'email' in response:
            self.user_id = response.get('id')
            self.log_test("User Profile", True)
            return True
        else:
            self.log_test("User Profile", False, f"Response: {response}")
            return False

    def test_transactions_list(self):
        """Test getting user transactions"""
        success, response = self.make_request('GET', '/transactions/me?period=month')
        
        if success and isinstance(response, list):
            self.log_test("Transactions List", True, f"Found {len(response)} transactions")
            return True
        else:
            self.log_test("Transactions List", False, f"Response: {response}")
            return False

    def test_transactions_summary(self):
        """Test getting transactions summary"""
        success, response = self.make_request('GET', '/transactions/summary?period=month')
        
        if success and 'balance' in response:
            self.log_test("Transactions Summary", True, f"Balance: {response.get('balance', 'N/A')}")
            return True
        else:
            self.log_test("Transactions Summary", False, f"Response: {response}")
            return False

    def test_create_transaction(self):
        """Test creating a new transaction"""
        transaction_data = {
            "type": "expense",
            "amount": 25.50,
            "currency": "USD",
            "category": "food",
            "note": "Test transaction from API test",
            "transaction_date": datetime.now().isoformat(),
            "source": "manual"
        }
        
        success, response = self.make_request(
            'POST', 
            '/transactions/',
            transaction_data,
            expected_status=201
        )
        
        if success and 'id' in response:
            self.log_test("Create Transaction", True, f"Created transaction ID: {response['id']}")
            return response['id']
        else:
            self.log_test("Create Transaction", False, f"Response: {response}")
            return None

    def test_ai_text_parsing(self):
        """Test AI text parsing functionality"""
        success, response = self.make_request(
            'POST',
            '/transactions/parse-text',
            {"text": "coffee 5 dollars yesterday"}
        )
        
        if success and 'amount' in response:
            self.log_test("AI Text Parsing", True, f"Parsed amount: {response.get('amount')}")
            return True
        else:
            self.log_test("AI Text Parsing", False, f"Response: {response}")
            return False

    def test_ai_chat(self):
        """Test AI assistant chat"""
        success, response = self.make_request(
            'POST',
            '/assistant/chat',
            {"message": "What are my top spending categories?", "context": {"source": "dashboard"}}
        )
        
        if success and 'reply' in response:
            self.log_test("AI Chat", True, f"Reply length: {len(response['reply'])} chars")
            return True
        else:
            self.log_test("AI Chat", False, f"Response: {response}")
            return False

    def test_insights(self):
        """Test transaction insights"""
        success, response = self.make_request('GET', '/transactions/insights?period=month')
        
        if success and 'insights' in response:
            insights_count = len(response['insights'])
            self.log_test("Transaction Insights", True, f"Found {insights_count} insights")
            return True
        else:
            self.log_test("Transaction Insights", False, f"Response: {response}")
            return False

    def test_period_filters(self):
        """Test different period filters"""
        periods = ['day', 'week', 'month', 'year']
        all_passed = True
        
        for period in periods:
            success, response = self.make_request('GET', f'/transactions/me?period={period}')
            if success and isinstance(response, list):
                self.log_test(f"Period Filter ({period})", True, f"Found {len(response)} transactions")
            else:
                self.log_test(f"Period Filter ({period})", False, f"Response: {response}")
                all_passed = False
        
        return all_passed

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Monefy AI Finance Tracker API Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)

        # Test authentication first
        if not self.test_auth_login():
            print("❌ Authentication failed - stopping tests")
            return False

        # Test user profile
        self.test_user_profile()

        # Test core transaction functionality
        self.test_transactions_list()
        self.test_transactions_summary()
        
        # Test transaction creation
        transaction_id = self.test_create_transaction()
        
        # Test AI features
        self.test_ai_text_parsing()
        self.test_ai_chat()
        
        # Test insights
        self.test_insights()
        
        # Test period filters
        self.test_period_filters()

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    """Main test execution"""
    tester = MonefyAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())