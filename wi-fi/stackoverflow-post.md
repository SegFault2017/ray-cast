# Stack Overflow Post

**Title:** macOS Tahoe: WiFi SSID shows as `<redacted>` when scanning from command line

**Tags:** `macos` `wifi` `terminal` `command-line` `macos-tahoe`

---

I'm trying to scan for available WiFi networks from the command line on macOS Tahoe 26.x, but all SSIDs are showing as `<redacted>`.

Using `system_profiler`:

```bash
/usr/sbin/system_profiler SPAirPortDataType
```

Output:
```
Other Local Wi-Fi Networks:
    <redacted>:
        PHY Mode: 802.11a/n/ac/ax
        Channel: 60 (5GHz, 160MHz)
        Network Type: Infrastructure
        Security: WPA2 Personal
    <redacted>:
        PHY Mode: 802.11a/n/ac
        Channel: 44 (5GHz, 80MHz)
        ...
```

The deprecated `airport` command returns no scan results at all:

```bash
/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s
```

Output:
```
WARNING: The airport command line tool is deprecated and will be removed in a future release.
For diagnosing Wi-Fi related issues, use the Wireless Diagnostics app or wdutil command line tool.
```

And `wdutil` requires sudo:
```bash
wdutil info
# usage: sudo wdutil ...
```

I understand this is a Location Services privacy restriction introduced in recent macOS versions. However, Terminal.app doesn't appear in System Settings → Privacy & Security → Location Services, so I can't grant it permission.

## My questions:

1. Is there any command-line method to scan WiFi networks with actual SSIDs on macOS Tahoe without requiring `sudo`?

2. Is there a way to trigger Location Services permission for Terminal.app so it appears in the privacy settings?

3. Are there any alternative tools or APIs (e.g., via `swift` or `python` with pyobjc) that can access CoreWLAN and properly request Location Services permission?

## What I've tried:
- `system_profiler SPAirPortDataType` → SSIDs redacted
- `airport -s` → deprecated, no output
- `networksetup -listpreferredwirelessnetworks en0` → only shows saved networks, not available ones
- Running from iTerm2 and Terminal.app → same result

**System:** macOS Tahoe 26.x, Apple Silicon
