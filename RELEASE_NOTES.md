# MKC Foods Corporation Ordering App — Release Notes

## 📱 Release Information
- **Version:** `v2.25.16`
- **Platform:** Android (React Native + Expo 55)
- **APK Download:** [Download MKC Foods Corporation v2.25.16 APK](https://drive.google.com/file/d/1EVd4Cn8sGZ95YshAJIk6YA-ZychM5iSx/view?usp=drive_link)
- **Direct Link:** `https://drive.google.com/file/d/1EVd4Cn8sGZ95YshAJIk6YA-ZychM5iSx/view?usp=drive_link`

---

## 🚀 What's New in v2.25.16

### 🗺️ Continuous Solid Route Lines & Dynamic HUD Style Switcher
- **Solid Delivery Route Lines:** Delivery path polyline renders as a clean, continuous solid line (`weight: 5`, `opacity: 0.85`, rounded line caps/joins) eliminating confusing dashed/skipping patterns.
- **On-the-Fly HUD Toggle:** Added a 1-tap `Solid` / `Dashed` toggle button directly on the map HUD overlay next to the layer selector.
- **Zero-Flicker Style Injection:** Dynamic Leaflet JavaScript bridge allows switching between solid and dashed paths with 0ms delay without reloading the map or losing cached tiles.

### 🎯 Live GPS Lock & Accurate Re-Centering
- **Fixed Hardcoded Location Lock:** Rider location re-centering now targets the rider's true live coordinates via fast cached location + balanced GPS accuracy rather than defaulting to central hub coordinates.
- **Instant Fix Button:** Tapping the GPS crosshair button immediately snaps the map camera to the rider's current position and refreshes local waypoint metrics.

### 🌙 Dark Mode Rider Cockpit Contrast Fix
- **Order Details Modal Dark Theme:** Resolved white background contrast issue in dark mode when inspecting active delivery order details inside the Rider GPS Cockpit.
- **Dynamic Color Tokens:** Card backgrounds, item lists, and text labels now render using high-contrast dark mode surface and text tokens.

---

## 📜 Previous Releases

### 📱 v2.25.13
- **APK Download:** [Download MKC Foods Corporation v2.25.13 APK](https://drive.google.com/file/d/1LFl9TMFmcw0WMfl3esCmQ1WIbDNVzdpP/view?usp=drive_link)
- **Official Central Hub Coordinates:** Standardized customer map picker and rider dispatch hub pin to Brgy. Tagumpay (`9.739768, 118.741293`).
- **Standardized Copy:** Removed gas station wording from customer reservation workflows (`Reserve Your Store Slot`).

### 📱 v2.25.11
- **APK Download:** [Download MKC Foods Corporation v2.25.11 APK](https://drive.google.com/file/d/1wuA_S__0qJWHIiEvb45lpXtx5xizoidt/view?usp=drive_link)
- **Admin Push Notification Broadcaster:** Interactive detail modal with category badges (`Weather`, `Promo`, `Announcement`, `Emergency`).
- **Cold-Start & Tray Click Routing:** Direct navigation to broadcast details when tapping notifications in the phone shade or lockscreen.
- **1-Tap Social Sharing:** Native OS sharing for food specials and advisories.
- **Dark Mode Polish:** Animated theme toggle transitions, neon status indicators, and themed checkout terms container.
