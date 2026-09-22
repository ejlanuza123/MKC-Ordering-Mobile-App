# MKC Foods Corporation Ordering App — Release Notes

## 📱 Release Information
- **Version:** `v2.25.13`
- **Platform:** Android / iOS (React Native + Expo 55)
- **APK Download:** [Download MKC Foods Corporation v2.25.13 APK](https://drive.google.com/file/d/1LFl9TMFmcw0WMfl3esCmQ1WIbDNVzdpP/view?usp=drive_link)
- **Direct Link:** `https://drive.google.com/file/d/1LFl9TMFmcw0WMfl3esCmQ1WIbDNVzdpP/view?usp=drive_link`

---

## 🚀 What's New in v2.25.13

### 🏬 Central Hub & Address Pin Precision
- **Official Central Hub Coordinates:** Realigned customer address picker to the verified MKC Central Hub coordinates (`9.73976834848973, 118.7412934387447`, Brgy. Tagumpay), completely removing legacy fallback coordinates.
- **Rider Navigation Hub Pin:** Added dedicated `🏬 MKC Foods Corporation (Puerto Branch)` store pin with popup dispatch details in `RiderMapScreen.js`.
- **Map Picker Badge Standardization:** Standardized customer map picker pin label to `🏬 MKC Foods Corp - Puerto Branch` to match the official landmark registry.
- **Store-to-Customer Distance & ETA Fallback:** Updated fallback routing in `riderLocation.js` to anchor directly to the Tagumpay Central Hub.

### 🍽️ Branding & Copy Standardization
- **Cleaned Up Reservation Copy:** Replaced gas station terminology in customer reservation flows:
  - Onboarding Step: `Reserve Your Store Slot`
  - Reservation Screen: `Add notes for the store (optional)`

---

## 📜 Previous Releases

### 📱 v2.25.11
- **APK Download:** [Download MKC Foods Corporation v2.25.11 APK](https://drive.google.com/file/d/1wuA_S__0qJWHIiEvb45lpXtx5xizoidt/view?usp=drive_link)
- **Admin Push Notification Broadcaster:** Interactive detail modal with category badges (`Weather`, `Promo`, `Announcement`, `Emergency`).
- **Cold-Start & Tray Click Routing:** Direct navigation to broadcast details when tapping notifications in the phone shade or lockscreen.
- **1-Tap Social Sharing:** Native OS sharing for food specials and advisories.
- **Dark Mode Polish:** Animated theme toggle transitions, neon status indicators, and themed checkout terms container.
