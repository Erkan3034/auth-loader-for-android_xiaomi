#!/usr/bin/env python3
"""
Xiaomi Sunucu Bağlantı Testi
Tests connection to Xiaomi unlock servers
"""

import requests
import socket
import time
import json
from urllib.parse import urlparse

class XiaomiConnectionTester:
    def __init__(self):
        self.endpoints = [
            'https://unlock.update.miui.com',
            'https://api.xiaomi.com',
            'https://account.xiaomi.com',
            'https://flash.update.miui.com'
        ]
        
    def test_dns_resolution(self, hostname):
        """Test DNS resolution for hostname"""
        try:
            ip = socket.gethostbyname(hostname)
            return True, ip
        except socket.gaierror as e:
            return False, str(e)
    
    def test_port_connectivity(self, hostname, port=443, timeout=10):
        """Test port connectivity"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((hostname, port))
            sock.close()
            return result == 0
        except Exception:
            return False
    
    def test_http_response(self, url, timeout=30):
        """Test HTTP response"""
        try:
            response = requests.get(url, timeout=timeout, verify=True)
            return True, response.status_code, response.headers.get('server', 'Unknown')
        except requests.exceptions.RequestException as e:
            return False, 0, str(e)
    
    def test_xiaomi_api_auth(self, authorized_id=None):
        """Test Xiaomi API authentication endpoint"""
        url = "https://unlock.update.miui.com/api/v1/status"
        headers = {
            'User-Agent': 'XiaomiUnlockClient/1.0.0',
            'Accept': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            return True, response.status_code, response.text[:200]
        except Exception as e:
            return False, 0, str(e)
    
    def run_full_test(self):
        """Run complete connection test"""
        print("🔍 Xiaomi Sunucu Bağlantı Testi")
        print("=" * 50)
        
        results = {
            'dns': {},
            'connectivity': {},
            'http': {},
            'api': {}
        }
        
        # Test DNS resolution
        print("\n📡 DNS Çözümleme Testi:")
        for endpoint in self.endpoints:
            hostname = urlparse(endpoint).netloc
            success, result = self.test_dns_resolution(hostname)
            results['dns'][hostname] = {'success': success, 'ip': result}
            
            status = "✅" if success else "❌"
            print(f"  {status} {hostname}: {result}")
        
        # Test port connectivity
        print("\n🔌 Port Bağlantı Testi:")
        for endpoint in self.endpoints:
            hostname = urlparse(endpoint).netloc
            success = self.test_port_connectivity(hostname, 443)
            results['connectivity'][hostname] = success
            
            status = "✅" if success else "❌"
            print(f"  {status} {hostname}:443")
        
        # Test HTTP responses
        print("\n🌐 HTTP Yanıt Testi:")
        for endpoint in self.endpoints:
            success, status_code, server = self.test_http_response(endpoint)
            results['http'][endpoint] = {
                'success': success,
                'status_code': status_code,
                'server': server
            }
            
            status_icon = "✅" if success else "❌"
            print(f"  {status_icon} {endpoint}: {status_code} ({server})")
        
        # Test Xiaomi API
        print("\n🔐 Xiaomi API Testi:")
        success, status_code, response = self.test_xiaomi_api_auth()
        results['api']['auth_test'] = {
            'success': success,
            'status_code': status_code,
            'response': response
        }
        
        status_icon = "✅" if success else "❌"
        print(f"  {status_icon} API Erişimi: {status_code}")
        if response:
            print(f"    Yanıt: {response}")
        
        # Summary
        print("\n📊 ÖZET:")
        dns_success = sum(1 for r in results['dns'].values() if r['success'])
        conn_success = sum(1 for r in results['connectivity'].values() if r)
        http_success = sum(1 for r in results['http'].values() if r['success'])
        api_success = 1 if results['api']['auth_test']['success'] else 0
        
        print(f"  DNS Çözümleme: {dns_success}/{len(self.endpoints)} ✅")
        print(f"  Port Bağlantısı: {conn_success}/{len(self.endpoints)} ✅")
        print(f"  HTTP Yanıtları: {http_success}/{len(self.endpoints)} ✅")
        print(f"  API Erişimi: {api_success}/1 ✅")
        
        total_tests = len(self.endpoints) * 3 + 1
        total_success = dns_success + conn_success + http_success + api_success
        success_rate = (total_success / total_tests) * 100
        
        print(f"\n🎯 Genel Başarı Oranı: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Xiaomi sunucularına bağlantı başarılı!")
        elif success_rate >= 50:
            print("⚠️ Bağlantıda bazı sorunlar var, ancak çalışabilir")
        else:
            print("❌ Ciddi bağlantı sorunları tespit edildi!")
        
        return results

if __name__ == "__main__":
    tester = XiaomiConnectionTester()
    results = tester.run_full_test()
    
    # Save results to file
    with open('xiaomi_connection_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Test sonuçları kaydedildi: xiaomi_connection_test_results.json")
