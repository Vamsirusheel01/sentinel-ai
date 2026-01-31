-- Supabase Schema for Sentinel AI
-- This creates a normalized, professional database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE NOT NULL,
    hostname TEXT NOT NULL,
    os TEXT NOT NULL,
    os_version TEXT,
    architecture TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    uid INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contexts (collection/correlation unit)
CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    context_id TEXT NOT NULL,
    context_type TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    duration_ms INTEGER,
    risk_score FLOAT
);

-- Events (normalized)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Process events (denormalized for speed)
CREATE TABLE process_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    pid INTEGER,
    ppid INTEGER,
    process_name TEXT,
    cmdline TEXT,
    username TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- File events (denormalized for speed)
CREATE TABLE file_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    operation TEXT,
    hash TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Network events (denormalized for speed)
CREATE TABLE network_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    pid INTEGER,
    process_name TEXT,
    src_ip TEXT,
    src_port INTEGER,
    dst_ip TEXT,
    dst_port INTEGER,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payloads (raw incoming data for audit trail)
CREATE TABLE payloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    payload_type TEXT,
    data JSONB NOT NULL,
    received_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_devices_created ON devices(created_at);
CREATE INDEX idx_users_device ON users(device_id);
CREATE INDEX idx_contexts_device ON contexts(device_id);
CREATE INDEX idx_events_created ON events(created_at);
CREATE INDEX idx_device_timestamp ON events(device_id, timestamp);
CREATE INDEX idx_event_type ON events(event_type);
CREATE INDEX idx_context ON events(context_id);
CREATE INDEX idx_process_timestamp ON process_events(device_id, timestamp);
CREATE INDEX idx_pid ON process_events(pid);
CREATE INDEX idx_file_timestamp ON file_events(device_id, timestamp);
CREATE INDEX idx_file_path ON file_events(file_path);
CREATE INDEX idx_network_timestamp ON network_events(device_id, timestamp);
CREATE INDEX idx_remote_ip ON network_events(dst_ip);
CREATE INDEX idx_payload_device ON payloads(device_id, received_at);
