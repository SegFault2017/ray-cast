# WiFi Connector

A powerful Raycast extension for managing WiFi networks on macOS. View, connect to, and share WiFi networks with ease.

## Features

### 🔍 Network Discovery
- Scan and display all available WiFi networks
- View signal strength, security type, and channel information
- Visual indicators for connected networks
- Real-time network status updates

### 📱 QR Code Sharing
- Generate QR codes for WiFi networks
- Share credentials easily with other devices
- Supports WPA/WPA2/WPA3, WEP, and Open networks
- Standard WiFi QR code format for universal compatibility
- Quick copy actions for credentials and passwords

### ⌨️ Keyboard Shortcuts

#### Network List
- **⌘⇧Q** - Share via QR Code
- **⌘R** - Refresh Networks
- **⌘C** - Copy SSID

#### Password Form
- **⌘⇧L** - Fetch from Keychain
- **Enter** - Connect to Network
- **Esc** - Cancel

#### QR Code View
- **⌘C** - Copy WiFi Credentials
- **⌘⇧C** - Copy Password Only

## Installation

1. Install [Raycast](https://raycast.com/) if you haven't already
2. Install this extension from the Raycast Store, or:
   ```bash
   npm install
   npm run build
   ```

## Usage

### Connecting to a Network
1. Open Raycast and search for "Select WiFi Network"
2. Browse available networks
3. Select a network to connect
4. For secured networks:
   - Enter password manually, or
   - Fetch from Keychain using **⌘⇧L**

### Sharing WiFi via QR Code
1. Select a network from the list
2. Press **⌘⇧Q** or select "Share Via QR Code"
3. Password is retrieved from macOS Keychain (requires authentication)
4. Scan the QR code with any device to connect

## Configuration

Configure the WiFi interface in Raycast preferences:
- **WiFi Interface**: Network interface name (default: `en0`)

## Requirements

- macOS (uses system_profiler and networksetup commands)
- Raycast v1.103.3 or higher
- Network permissions granted to Raycast

## Privacy & Security

- **No local password storage** - all passwords are managed by macOS Keychain
- Keychain access requires macOS authentication for security
- No data is transmitted outside your device
- QR codes are generated locally
- Extension only reads passwords from Keychain, never writes to it

## Development

```bash
# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Auto-fix linting issues
npm run fix-lint
```

## Technical Details

### Architecture
- **React + TypeScript** for type safety and modern development
- **Modular component structure** for maintainability
- **Custom hooks** for state management
- **Utility functions** for password and cache management

### Dependencies
- `@raycast/api` - Raycast extension API
- `@raycast/utils` - Utility functions
- `qrcode` - QR code generation

## License

MIT

## Author

Ray Tan (@ray_tan)

## Contributing

Issues and pull requests are welcome!
