# MKC Foods Corporation Ordering App — Release Notes

## 📱 Release Information
- **Version:** `v2.25.11`
- **Platform:** Android / iOS (React Native + Expo 55)
- **APK Download:** [Download MKC Foods Corporation v2.25.11 APK](https://drive.google.com/file/d/1wuA_S__0qJWHIiEvb45lpXtx5xizoidt/view?usp=drive_link)
- **Direct Link:** `https://drive.google.com/file/d/1wuA_S__0qJWHIiEvb45lpXtx5xizoidt/view?usp=drive_link`

---

## 🚀 What's New in v2.25.11

### 📢 Admin Push Notification Broadcaster & Deep Linking
- **Interactive Broadcast Detail Modal:** Tapping push notifications opens a high-contrast modal with official announcement badges (`🌧️ Weather`, `🔥 Promo`, `📢 Announcement`, `⚠️ Emergency`).
- **1-Tap Social Sharing:** Native OS social sharing via `Share.share` lets users immediately forward food specials or weather advisories via Messenger, WhatsApp, or SMS.
- **Contextual Navigation:** Fast shortcuts directly to the food menu for customers, or active delivery queue for riders.
- **Cold-Start & Tray Click Routing:** Clicking push notifications in the smartphone notification shade or lockscreen correctly routes directly to the broadcast detail modal, even when the app was completely closed or killed.

### 🎨 Dark Mode & Contrast Enhancements
- **Smooth Theme Animations:** Added spinning & scaling icon animations for the Dark Mode switch in Customer and Rider Profile screens.
- **Neon Status Indicators:** High-contrast neon badges for food order statuses in dark mode for optimal day/night visibility.
- **Themed Borders & Layouts:** Polished checkout terms boxes, text inputs, and modals to eliminate hardcoded backgrounds and text color clipping.

---

## 🛠️ Bug Fixes & Stability
- **Fixed System Tray Navigation:** Resolved issue where clicking notifications in the smartphone notification tray only opened the app without showing the announcement modal.
- **Fixed Real-Time Foreground Notifications:** Foreground broadcast alerts now carry full metadata and category formatting.
- **Fixed Navigation Theme Font Crash:** Resolved `regular of undefined` error in custom navigation headers.
- **Database Check Constraint:** Updated notification check constraint to allow `'broadcast'` notification type.
