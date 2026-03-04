/*
  Sentinel AI - YARA Rules for Process Command Line Detection
  Detects suspicious process execution patterns
*/

rule credential_dumping {
    meta:
        description = "Credential dumping attempts"
        severity = "critical"
    strings:
        $mimikatz = "mimikatz" nocase
        $sekurlsa = "sekurlsa" nocase
        $pykatz = "pykatz" nocase
        $pypykatz = "pypykatz" nocase
    condition:
        any of them
}

rule obfuscated_powershell {
    meta:
        description = "Encoded or obfuscated PowerShell execution"
        severity = "critical"
    strings:
        $ps = "powershell" nocase
        $enc1 = " -enc " nocase
        $enc2 = " -encodedcommand " nocase
        $enc3 = " -e " nocase
    condition:
        $ps and any of ($enc*)
}

rule shadow_copy_deletion {
    meta:
        description = "Deletion of Volume Shadow Copies"
        severity = "critical"
    strings:
        $vss1 = "vssadmin" nocase
        $vss2 = "delete" nocase
        $vss3 = "shadow" nocase
        $wmic = "wmic" nocase
        $diskshadow = "diskshadow" nocase
    condition:
        ($vss1 and $vss2 and $vss3) or
        ($wmic and "shadowcopy") or
        $diskshadow
}

rule registry_modification {
    meta:
        description = "Direct registry modification (potential persistence)"
        severity = "high"
    strings:
        $reg = "reg" nocase
        $add = "add" nocase
        $hk = "hkcu" nocase
    condition:
        all of them
}

rule scheduled_task_creation {
    meta:
        description = "Suspicious scheduled task creation"
        severity = "high"
    strings:
        $schtasks = "schtasks" nocase
        $create = "create" nocase
    condition:
        all of them
}

rule file_download_tools {
    meta:
        description = "File download tools (bitsadmin/certutil)"
        severity = "high"
    strings:
        $bitsadmin = "bitsadmin" nocase
        $transfer = "transfer" nocase
        $certutil = "certutil" nocase
        $urlcache = "urlcache" nocase
    condition:
        ($bitsadmin and $transfer) or ($certutil and $urlcache)
}

rule wmi_lateral_movement {
    meta:
        description = "WMI process creation"
        severity = "high"
    strings:
        $wmic = "wmic" nocase
        $process = "process" nocase
        $create = "call create" nocase
    condition:
        all of them
}

rule lolbin_execution {
    meta:
        description = "Living-off-the-land binary execution"
        severity = "medium"
    strings:
        $rundll32 = "rundll32.exe" nocase
        $mshta = "mshta.exe" nocase
        $regsvcs = "regsvcs.exe" nocase
        $regasm = "regasm.exe" nocase
    condition:
        any of them
}

rule recon_commands {
    meta:
        description = "System reconnaissance commands"
        severity = "low"
    strings:
        $whoami = "whoami" nocase
        $systeminfo = "systeminfo" nocase
        $net_user = "net user" nocase
        $net_group = "net localgroup" nocase
        $nltest = "nltest" nocase
        $ipconfig = "ipconfig /all" nocase
    condition:
        any of them
}

rule network_tools {
    meta:
        description = "Network scanning and enumeration tools"
        severity = "medium"
    strings:
        $nmap = "nmap" nocase
        $netcat = "netcat" nocase
        $nc_exe = "nc.exe" nocase
        $telnet = "telnet.exe" nocase
    condition:
        any of them
}
