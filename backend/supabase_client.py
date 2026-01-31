# supabase_client.py
# PostgreSQL/Supabase backend client

import os
import json
from datetime import datetime
from typing import Dict, List, Any

try:
    from supabase import create_client, Client
except ImportError:
    Client = None


class SupabaseDB:
    """Professional database client for Sentinel AI using Supabase (PostgreSQL)"""
    
    def __init__(self, url: str = None, key: str = None):
        """
        Initialize Supabase client
        
        Get these from: https://supabase.com/dashboard/projects
        Then set env vars:
          SUPABASE_URL=your_project_url
          SUPABASE_KEY=your_anon_key
        """
        if Client is None:
            raise ImportError("Install: pip install supabase")
        
        url = url or os.getenv("SUPABASE_URL")
        key = key or os.getenv("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError(
                "Set SUPABASE_URL and SUPABASE_KEY environment variables or pass to __init__"
            )
        
        self.client: Any = create_client(url, key)
    
    def store_device(self, device_id: str, hostname: str, os: str, 
                     os_version: str, architecture: str) -> Dict:
        """Store or update device info"""
        response = self.client.table("devices").upsert({
            "device_id": device_id,
            "hostname": hostname,
            "os": os,
            "os_version": os_version,
            "architecture": architecture,
            "updated_at": datetime.utcnow().isoformat()
        }, on_conflict="device_id").execute()
        return response.data[0] if response.data else {}
    
    def store_context(self, device_id: str, context_id: str, 
                      context_type: str = None, duration_ms: int = None) -> Dict:
        """Store event context"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        
        if not device.data:
            raise ValueError(f"Device {device_id} not found")
        
        device_uuid = device.data[0]["id"]
        
        response = self.client.table("contexts").insert({
            "device_id": device_uuid,
            "context_id": context_id,
            "context_type": context_type,
            "duration_ms": duration_ms
        }).execute()
        
        return response.data[0] if response.data else {}
    
    def store_event(self, device_id: str, context_id: str, event_type: str,
                    timestamp: str, raw_data: Dict) -> Dict:
        """Store generic event"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        ctx = self.client.table("contexts").select("id").eq(
            "context_id", context_id
        ).execute()
        
        if not device.data or not ctx.data:
            return {}
        
        response = self.client.table("events").insert({
            "device_id": device.data[0]["id"],
            "context_id": ctx.data[0]["id"],
            "event_type": event_type,
            "timestamp": timestamp,
            "raw_data": raw_data
        }).execute()
        
        return response.data[0] if response.data else {}
    
    def store_process_event(self, device_id: str, event_id: str, 
                            pid: int, ppid: int, process_name: str,
                            cmdline: str, username: str, timestamp: str) -> Dict:
        """Store process execution event"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        event = self.client.table("events").select("id").eq("id", event_id).execute()
        
        if not device.data or not event.data:
            return {}
        
        response = self.client.table("process_events").insert({
            "device_id": device.data[0]["id"],
            "event_id": event_id,
            "pid": pid,
            "ppid": ppid,
            "process_name": process_name,
            "cmdline": cmdline,
            "username": username,
            "timestamp": timestamp
        }).execute()
        
        return response.data[0] if response.data else {}
    
    def store_file_event(self, device_id: str, event_id: str,
                         file_path: str, operation: str, hash_val: str = None,
                         timestamp: str = None) -> Dict:
        """Store file system event"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        
        if not device.data:
            return {}
        
        response = self.client.table("file_events").insert({
            "device_id": device.data[0]["id"],
            "event_id": event_id,
            "file_path": file_path,
            "operation": operation,
            "hash": hash_val,
            "timestamp": timestamp or datetime.utcnow().isoformat()
        }).execute()
        
        return response.data[0] if response.data else {}
    
    def store_network_event(self, device_id: str, event_id: str,
                            pid: int, process_name: str,
                            src_ip: str, src_port: int,
                            dst_ip: str, dst_port: int,
                            timestamp: str) -> Dict:
        """Store network connection event"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        
        if not device.data:
            return {}
        
        response = self.client.table("network_events").insert({
            "device_id": device.data[0]["id"],
            "event_id": event_id,
            "pid": pid,
            "process_name": process_name,
            "src_ip": src_ip,
            "src_port": src_port,
            "dst_ip": dst_ip,
            "dst_port": dst_port,
            "timestamp": timestamp
        }).execute()
        
        return response.data[0] if response.data else {}
    
    def store_payload(self, device_id: str, payload_type: str, data: Dict) -> Dict:
        """Store raw payload for audit"""
        device = self.client.table("devices").select("id").eq(
            "device_id", device_id
        ).execute()
        
        if not device.data:
            return {}
        
        response = self.client.table("payloads").insert({
            "device_id": device.data[0]["id"],
            "payload_type": payload_type,
            "data": data
        }).execute()
        
        return response.data[0] if response.data else {}

    def get_payloads(self, device_id: str = None, limit: int = 100) -> List[Dict]:
        """Fetch recent raw payloads"""
        query = self.client.table("payloads").select("*").order(
            "received_at", desc=True
        ).limit(limit)

        if device_id:
            device = self.client.table("devices").select("id").eq(
                "device_id", device_id
            ).execute()
            if device.data:
                query = query.eq("device_id", device.data[0]["id"])

        response = query.execute()
        return response.data if response.data else []
    
    def get_recent_events(self, device_id: str = None, limit: int = 100) -> List[Dict]:
        """Fetch recent events, optionally filtered by device"""
        query = self.client.table("events").select("*").order(
            "timestamp", desc=True
        ).limit(limit)
        
        if device_id:
            device = self.client.table("devices").select("id").eq(
                "device_id", device_id
            ).execute()
            if device.data:
                query = query.eq("device_id", device.data[0]["id"])
        
        response = query.execute()
        return response.data if response.data else []
    
    def get_devices(self) -> List[Dict]:
        """Fetch all devices"""
        response = self.client.table("devices").select("*").execute()
        return response.data if response.data else []
    
    def get_process_activity(self, device_id: str = None, limit: int = 100) -> List[Dict]:
        """Fetch process execution activity"""
        query = self.client.table("process_events").select(
            "*, devices(hostname)"
        ).order("timestamp", desc=True).limit(limit)
        
        if device_id:
            device = self.client.table("devices").select("id").eq(
                "device_id", device_id
            ).execute()
            if device.data:
                query = query.eq("device_id", device.data[0]["id"])
        
        response = query.execute()
        return response.data if response.data else []
    
    def get_file_activity(self, device_id: str = None, limit: int = 100) -> List[Dict]:
        """Fetch file system activity"""
        query = self.client.table("file_events").select(
            "*, devices(hostname)"
        ).order("timestamp", desc=True).limit(limit)
        
        if device_id:
            device = self.client.table("devices").select("id").eq(
                "device_id", device_id
            ).execute()
            if device.data:
                query = query.eq("device_id", device.data[0]["id"])
        
        response = query.execute()
        return response.data if response.data else []
    
    def get_network_activity(self, device_id: str = None, limit: int = 100) -> List[Dict]:
        """Fetch network activity"""
        query = self.client.table("network_events").select(
            "*, devices(hostname)"
        ).order("timestamp", desc=True).limit(limit)
        
        if device_id:
            device = self.client.table("devices").select("id").eq(
                "device_id", device_id
            ).execute()
            if device.data:
                query = query.eq("device_id", device.data[0]["id"])
        
        response = query.execute()
        return response.data if response.data else []


# Convenience singleton
_db_instance = None

def get_db() -> SupabaseDB:
    """Get or create the database client"""
    global _db_instance
    if _db_instance is None:
        _db_instance = SupabaseDB()
    return _db_instance
