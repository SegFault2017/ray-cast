/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `toggle-wi-fi` command */
  export type ToggleWiFi = ExtensionPreferences & {}
  /** Preferences accessible in the `wi-fi-signal` command */
  export type WiFiSignal = ExtensionPreferences & {
  /**  - Show wifi name in menu bar */
  "showWifiName": boolean,
  /**  - Show IP address in menu bar */
  "showIpAddress": boolean
}
  /** Preferences accessible in the `select-wifi` command */
  export type SelectWifi = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `toggle-wi-fi` command */
  export type ToggleWiFi = {}
  /** Arguments passed to the `wi-fi-signal` command */
  export type WiFiSignal = {}
  /** Arguments passed to the `select-wifi` command */
  export type SelectWifi = {}
}


