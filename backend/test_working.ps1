$ErrorActionPreference = 'Stop'

$baseUrl = 'http://127.0.0.1:5000'
$passed = 0
$failed = 0

function Write-Pass($message) {
    $script:passed++
    Write-Host "PASS: $message" -ForegroundColor Green
}

function Write-Fail($message) {
    $script:failed++
    Write-Host "FAIL: $message" -ForegroundColor Red
}

function Assert-True($condition, $passMessage, $failMessage) {
    if ($condition) {
        Write-Pass $passMessage
    }
    else {
        Write-Fail $failMessage
    }
}

function New-Device($prefix) {
    return @{
        device_id = "$prefix-$([guid]::NewGuid().ToString('N').Substring(0, 10))"
        hostname = 'local'
        os = 'Windows'
        os_version = '11'
        architecture = 'x64'
    }
}

function Send-Event($device, $processName, $cmdline) {
    $payload = @{
        device = $device
        events = @(
            @{
                event_type = 'process_start'
                process_name = $processName
                cmdline = $cmdline
            }
        )
    }

    $json = $payload | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Uri "$baseUrl/api/logs" -Method Post -ContentType 'application/json' -Body $json
}

Write-Host '--- Sentinel AI Working Test ---' -ForegroundColor Cyan

# 1) Backend health/status
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/api/status" -Method Get
    $hasDevices = $null -ne $status.devices
    $hasEvents = $null -ne $status.recent_events
    Assert-True ($hasDevices -and $hasEvents) 'Backend /api/status responded with devices and recent_events.' 'Backend /api/status missing expected keys.'
}
catch {
    Write-Fail "Backend not reachable at $baseUrl. Start backend with: python app.py"
}

# 2) Benign event should stay high trust
try {
    $benignDevice = New-Device 'smoke-benign'
    $benign = Send-Event -device $benignDevice -processName 'chrome.exe' -cmdline 'chrome.exe --type=renderer'

    $okStatus = $benign.status -eq 'success'
    $highScore = [double]$benign.trust_score -ge 99.0
    Assert-True $okStatus 'Benign event accepted (status=success).' 'Benign event post failed.'
    Assert-True $highScore "Benign trust score is high ($($benign.trust_score))." "Benign trust score too low ($($benign.trust_score))."
}
catch {
    Write-Fail "Benign test failed: $($_.Exception.Message)"
}

# 3) Critical event should reduce trust to <=95
try {
    $criticalDevice = New-Device 'smoke-critical'
    $critical = Send-Event -device $criticalDevice -processName 'powershell.exe' -cmdline 'powershell.exe -e abc123'

    $criticalStatus = $critical.status -eq 'success'
    $criticalDrop = [double]$critical.trust_score -le 95.0
    $criticalFeedback = ($critical.feedback -match 'CRITICAL|WARNING')

    Assert-True $criticalStatus 'Critical event accepted (status=success).' 'Critical event post failed.'
    Assert-True $criticalDrop "Critical event lowered trust score ($($critical.trust_score))." "Critical event did not lower trust enough ($($critical.trust_score))."
    Assert-True $criticalFeedback "Critical feedback returned: $($critical.feedback)." "Unexpected feedback for critical event: $($critical.feedback)."
}
catch {
    Write-Fail "Critical test failed: $($_.Exception.Message)"
}

Write-Host "`nSummary: Passed=$passed Failed=$failed" -ForegroundColor Yellow

if ($failed -gt 0) {
    exit 1
}

exit 0