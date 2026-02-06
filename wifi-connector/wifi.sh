#!/bin/bash

# macOS Tahoe WiFi SSID extraction
# Apple redacts SSID from all public APIs, but the CachedScanRecord
# in scutil still contains the actual network data in a binary plist!

get_ssid_from_scutil() {
    local hex_data xml_data

    # Query scutil for the AirPort state (contains CachedScanRecord)
    hex_data=$(scutil <<EOF 2>/dev/null | grep "CachedScanRecord" | sed 's/.*<data> 0x//'
open
show State:/Network/Interface/en0/AirPort
quit
EOF
)

    [[ -z "$hex_data" ]] && return

    # Decode hex → binary plist → XML, then extract SSID-like strings
    xml_data=$(echo "$hex_data" | xxd -r -p | plutil -convert xml1 -o - - 2>/dev/null)

    # Filter for network names: starts with letter, no underscores, not all-caps technical keys
    echo "$xml_data" \
        | grep -oE '<string>[A-Za-z][A-Za-z0-9 -]{1,31}</string>' \
        | sed 's/<[^>]*>//g' \
        | grep -v '^[A-Z][A-Z]' \
        | grep -v '^[A-F0-9]\{12\}$' \
        | grep -vi 'Quantenna\|Topaz\|Broadcom\|Intel\|Realtek\|Atheros\|Mediatek' \
        | head -1
}

# Get the SSID
SSID=$(get_ssid_from_scutil)

# Fallback if extraction failed
if [[ -z "$SSID" ]]; then
    CHANNEL=$(system_profiler SPAirPortDataType 2>/dev/null | awk '
        /^ *Current Network Information:/ { in_curr=1; next }
        in_curr && /^ *Channel:/ { print $2; exit }
    ')

    case "$CHANNEL" in
        [1-9]|1[0-3])               SSID="WiFi (2.4GHz)" ;;
        3[6-9]|[4-9][0-9]|1[0-6][0-9]) SSID="WiFi (5GHz)" ;;
        *)                          SSID="WiFi (?)" ;;
    esac
fi

echo "$SSID"

