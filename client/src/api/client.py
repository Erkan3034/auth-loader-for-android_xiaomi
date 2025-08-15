"""API client for communicating with the Xiaomi Unlock Server."""

import asyncio
import hashlib
import hmac
import json
import time
from typing import Dict, Any, Optional, List
from urllib.parse import urljoin

import aiohttp
import requests

from ..utils.config import Config


class APIClient:
    """Client for API communication with the server."""
    
    def __init__(self, config: Config, logger):
        self.config = config
        self.logger = logger
        self.base_url = config.get_api_base_url()
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.server.timeout),
            headers={'User-Agent': self.config.client.user_agent}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    def _generate_signature(self, method: str, path: str, body: str, timestamp: int) -> str:
        """Generate HMAC signature for request."""
        data_to_sign = f"{method}{path}{body}{timestamp}{self.config.client.id}"
        signature = hmac.new(
            self.config.client.hmac_secret.encode(),
            data_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _get_headers(self, method: str, path: str, body: str = "") -> Dict[str, str]:
        """Get headers with HMAC signature."""
        timestamp = int(time.time())
        signature = self._generate_signature(method, path, body, timestamp)
        
        return {
            'Content-Type': 'application/json',
            'X-Client-ID': self.config.client.id,
            'X-Timestamp': str(timestamp),
            'X-Signature': signature,
            'User-Agent': self.config.client.user_agent
        }
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make an HTTP request with retries."""
        url = urljoin(self.base_url, endpoint)
        path = f"/api{endpoint}"
        body = json.dumps(data) if data else ""
        headers = self._get_headers(method, path, body)
        
        for attempt in range(self.config.server.retry_attempts):
            try:
                if not self.session:
                    # Fallback to synchronous requests
                    return self._make_sync_request(method, url, headers, data)
                
                async with self.session.request(
                    method,
                    url,
                    headers=headers,
                    json=data if data else None
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        self.logger.debug(f"API request successful: {method} {endpoint}")
                        return result
                    elif response.status == 401:
                        error_data = await response.json()
                        self.logger.error(f"Authentication failed: {error_data.get('error', 'Unknown error')}")
                        return None
                    elif response.status == 429:
                        self.logger.warning("Rate limit exceeded, waiting...")
                        await asyncio.sleep(self.config.server.retry_delay * (attempt + 1))
                        continue
                    else:
                        error_data = await response.json()
                        self.logger.error(f"API request failed: {response.status} - {error_data.get('error', 'Unknown error')}")
                        
                        if attempt < self.config.server.retry_attempts - 1:
                            await asyncio.sleep(self.config.server.retry_delay)
                            continue
                        return None
                        
            except asyncio.TimeoutError:
                self.logger.warning(f"Request timeout (attempt {attempt + 1})")
                if attempt < self.config.server.retry_attempts - 1:
                    await asyncio.sleep(self.config.server.retry_delay)
                    continue
                self.logger.error("Request failed after all retry attempts")
                return None
            except Exception as e:
                self.logger.error(f"Request error: {e}")
                if attempt < self.config.server.retry_attempts - 1:
                    await asyncio.sleep(self.config.server.retry_delay)
                    continue
                return None
        
        return None
    
    def _make_sync_request(self, method: str, url: str, headers: Dict[str, str], data: Optional[Dict] = None) -> Optional[Dict]:
        """Make synchronous HTTP request as fallback."""
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                json=data,
                timeout=self.config.server.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"Sync request failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            self.logger.error(f"Sync request error: {e}")
            return None
    
    async def health_check(self) -> bool:
        """Check server health."""
        try:
            # Health endpoint doesn't require HMAC
            url = urljoin(self.config.server.url, '/health')
            
            if self.session:
                async with self.session.get(url) as response:
                    return response.status == 200
            else:
                response = requests.get(url, timeout=5)
                return response.status_code == 200
                
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False
    
    async def request_auth_key(self, device_info: Dict[str, Any]) -> Optional[Dict]:
        """Request authentication key for device."""
        self.logger.info(f"Requesting auth key for device {device_info.get('serialNumber', 'unknown')}")
        
        data = {
            'deviceInfo': device_info
        }
        
        result = await self._make_request('POST', '/auth/request-key', data)
        
        if result and result.get('success'):
            self.logger.info("Auth key received successfully")
            return result
        else:
            self.logger.error("Failed to get auth key")
            return None
    
    async def verify_auth_key(self, auth_key: str, device_id: str) -> bool:
        """Verify authentication key."""
        data = {
            'authKey': auth_key,
            'deviceId': device_id
        }
        
        result = await self._make_request('POST', '/auth/verify-key', data)
        
        if result and result.get('success'):
            return result.get('valid', False)
        return False
    
    async def refresh_auth_key(self, auth_key: str, device_id: str) -> Optional[Dict]:
        """Refresh authentication key."""
        data = {
            'authKey': auth_key,
            'deviceId': device_id
        }
        
        result = await self._make_request('POST', '/auth/refresh-key', data)
        
        if result and result.get('success'):
            self.logger.info("Auth key refreshed successfully")
            return result
        return None
    
    async def register_device(self, device_info: Dict[str, Any]) -> bool:
        """Register device with server."""
        self.logger.info(f"Registering device {device_info.get('serialNumber', 'unknown')}")
        
        result = await self._make_request('POST', '/device/register', device_info)
        
        if result and result.get('success'):
            self.logger.info("Device registered successfully")
            return True
        else:
            self.logger.error("Failed to register device")
            return False
    
    async def get_device_info(self, device_id: str) -> Optional[Dict]:
        """Get device information."""
        result = await self._make_request('GET', f'/device/{device_id}')
        
        if result and result.get('success'):
            return result.get('device')
        return None
    
    async def ping_device(self, device_id: str) -> bool:
        """Update device last seen timestamp."""
        result = await self._make_request('PUT', f'/device/{device_id}/ping')
        return result and result.get('success', False)
    
    async def start_unlock_operation(self, device_id: str, auth_key: str, operation_type: str, metadata: Optional[Dict] = None) -> Optional[Dict]:
        """Start unlock operation."""
        self.logger.info(f"Starting {operation_type} operation for device {device_id}")
        
        data = {
            'deviceId': device_id,
            'authKey': auth_key,
            'operationType': operation_type,
            'metadata': metadata or {}
        }
        
        result = await self._make_request('POST', '/unlock/start', data)
        
        if result and result.get('success'):
            self.logger.info(f"Unlock operation started: {result.get('operation', {}).get('id')}")
            return result
        else:
            self.logger.error("Failed to start unlock operation")
            return None
    
    async def update_operation_status(self, operation_id: int, status: str, error_message: Optional[str] = None, progress: Optional[int] = None) -> bool:
        """Update operation status."""
        data = {
            'status': status
        }
        
        if error_message:
            data['errorMessage'] = error_message
        
        if progress is not None:
            data['progress'] = progress
        
        result = await self._make_request('PUT', f'/unlock/{operation_id}/status', data)
        
        if result and result.get('success'):
            self.logger.debug(f"Operation {operation_id} status updated to {status}")
            return True
        return False
    
    async def get_operation_info(self, operation_id: int) -> Optional[Dict]:
        """Get operation information."""
        result = await self._make_request('GET', f'/unlock/{operation_id}')
        
        if result and result.get('success'):
            return result.get('operation')
        return None
    
    async def get_device_operations(self, device_id: str, limit: int = 10) -> Optional[List[Dict]]:
        """Get operations for a device."""
        result = await self._make_request('GET', f'/unlock/device/{device_id}?limit={limit}')
        
        if result and result.get('success'):
            return result.get('operations', [])
        return None
    
    async def get_operation_history(self, limit: int = 50, offset: int = 0) -> Optional[Dict]:
        """Get operation history."""
        result = await self._make_request('GET', f'/unlock?limit={limit}&offset={offset}')
        
        if result and result.get('success'):
            return result
        return None
    
    async def get_operation_stats(self, timeframe: str = '24 hours') -> Optional[Dict]:
        """Get operation statistics."""
        result = await self._make_request('GET', f'/unlock/stats/summary?timeframe={timeframe}')
        
        if result and result.get('success'):
            return result.get('stats')
        return None
