# ESL LIMS Mobile — User Manual

**Version 1.0.0** · Android and iOS

ESL LIMS is the mobile app for the ESL Laboratory Information Management System. Use it on your phone or tablet to:

- browse the labs at your plant
- look up sample definitions and their test parameters
- receive notifications from the lab and open the related records
- send notifications to colleagues by role

---

## Contents

1. [Before you start](#1-before-you-start)
2. [Signing in](#2-signing-in)
3. [Finding your way around](#3-finding-your-way-around)
4. [Home screen and labs](#4-home-screen-and-labs)
5. [Lab screen](#5-lab-screen)
6. [Samples screen](#6-samples-screen)
7. [Sample details](#7-sample-details)
8. [Notifications](#8-notifications)
9. [Sending a notification](#9-sending-a-notification)
10. [Signing out](#10-signing-out)
11. [Messages and what they mean](#11-messages-and-what-they-mean)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQ](#13-faq)
- [Appendix A: For administrators and IT](#appendix-a-for-administrators-and-it)
- [Appendix B: Glossary](#appendix-b-glossary)

---

## 1. Before you start

You need:

| Requirement | Details |
|---|---|
| A device | An Android phone or tablet, or an iPhone or iPad. The app works in portrait and landscape. |
| An ESL LIMS account | The same **User ID** and **Password** you use for ESL LIMS. Ask your administrator if you don't have one. |
| A network connection | Every screen loads live data from the LIMS server, so you need Wi-Fi or mobile data. If the server is on the company network, connect to it first, for example over VPN. |
| Notification permission | Optional, but you need it to receive alerts. The app asks for it the first time you sign in. |

> **Note:** Push notifications only work on a real phone or tablet. They don't work in emulators or simulators.

---

## 2. Signing in

1. Open **ESL LIMS**.
2. Enter your **User ID**.
3. Tap **Next** on the keyboard, or tap the **Password** field, and enter your password.
   - To check what you typed, tap **Show**. Tap **Hide** to mask it again.
4. Tap **Login**, or tap **Go** on the keyboard.

After you sign in, the app opens the **Home** screen.

### Staying signed in

The app saves your session securely on the device. The next time you open it, you go straight to **Home** without signing in again.

You have to sign in again when:

- your session expires (the server sets how long it lasts)
- the server rejects your session, for example because your password changed or an administrator revoked your access. The app signs you out on its own.
- you tap **Logout**

### First sign-in on a device

After your first sign-in, the app asks for permission to send notifications. Tap **Allow** if you want lab alerts on this device. You can change this later in your device's **Settings › Notifications › ESL LIMS**.

---

## 3. Finding your way around

### The side menu (drawer)

Tap the **☰ menu** icon at the top left, or swipe in from the left edge. The menu shows:

- the **ESL LIMS** logo
- your **user name** and **role** (for example *ANALYST* or *LAB HEAD*)
- the menu items:

| Item | What it opens |
|---|---|
| **Home** | Your plant's labs |
| **Notifications** | Notifications you've received, with a red badge showing how many are unread |
| **Send Notification** | A form for sending a notification to other users |

- **Logout**, at the bottom

### The notification bell

The **🔔 bell** icon at the top right of Home and Send Notification opens your notifications. A red badge shows how many are unread. Counts over 99 show as **99+**.

### Going back

- On the **Lab** screen, tap the **‹ back** arrow at the top left.
- On the **Samples** screen, tap **Back** in the header.
- On Android, you can also use the system back button or gesture.

---

## 4. Home screen and labs

The Home screen has two parts.

**Welcome card**

- your initials in a circle
- *Welcome back,* followed by your user name
- your **location** (site) name
- your **role**

**Labs**

One tile for each lab at your plant. The app finds them from your company: **Company → Location → Plant → Labs**.

Well-known labs have their own icon and color:

| Lab | Icon |
|---|---|
| CENTRAL LAB | Flask (blue) |
| DIP LAB | Pipe/spigot (violet) |
| SMS LAB | Flame (orange) |
| WRM LAB | Cable (green) |
| BRM LAB | Stacked layers (amber) |
| WIP LAB | Gears (teal) |

Other labs show a flask icon in a rotating color.

**To open a lab,** tap its tile.

> **Note:** If your location has more than one plant, the app shows the labs of the **first** plant. You can't switch plants in the app yet.

### When nothing is found

If part of the setup is missing, the app shows a message instead of the lab tiles:

| Message | Meaning | What to do |
|---|---|---|
| **Location not found** | Your company has no location set up. | Contact your administrator. |
| **Plant not found** | Your location has no plants set up. | Contact your administrator. |
| **Labs not found** | Your plant has no labs set up. | Contact your administrator. |

These messages also pop up as a dialog the first time. Tap to close it.

---

## 5. Lab screen

The Lab screen lists the **units (items)** in the lab you chose.

- The colored header shows the lab's icon, its name, and how many items it has, for example *5 items*.
- Each row is one item. Tap it to see its samples.

If the lab has no items, you see **"No items found — There are no items under <lab> yet."**

If you open a lab that no longer exists, for example from an old link, you see **"Lab not found"**. Tap the back arrow to return to Home.

---

## 6. Samples screen

The Samples screen lists the **sample definitions** for the item you chose.

The top of the screen shows:

- the **lab name** as a colored tag
- the **item name** as the title
- the **number of samples** shown, for example *12 samples*

Each sample card shows its **name**, its **description** (if there is one), and its **financial year**, for example *2025-26*.

### Filtering by financial year

If the samples cover more than one financial year, a row of chips appears:

- **All years** shows everything. This is the default.
- Tap a year, for example **2025-26**, to show only that year.

Swipe the chip row sideways to see more years.

### Sorting

Tap the **Newest / Oldest** button next to the chips to change the order:

- **↓ Newest** shows the latest financial year first. This is the default.
- **↑ Oldest** shows the earliest financial year first.

Samples in the same year are listed alphabetically.

### Opening a sample

Tap a sample card to open its **details**. See the next section.

If there are no samples, you see **"Sample not found — No samples are available for <item> yet."**

---

## 7. Sample details

Sample details open in a panel that slides up from the bottom.

### Details

Only fields that have a value are shown.

| Field | Description |
|---|---|
| Financial year | The year the sample definition belongs to |
| Sample type | For example, raw material or in-process |
| Sample format | How the sample is recorded |
| Frequency | How often the sample is taken |
| Material category | The material group |
| Analysis code | The analysis method code |
| Plant | Plant name and code |
| Unit / Sub unit | Where the sample comes from |
| Retention period | How long the sample is kept |
| Reporting time | Time allowed to report results |
| Created by / Created on | Who created the record and when. Dates look like *18 Jun 2026, 6:29 PM* in server time. |

### Parameters

Below the details is the list of **Parameters**, the tests or readings for the sample, in their set order. For each parameter you see:

- the **parameter name**
- its **value and unit**, for example *0.45 %*. A dash (—) means no value has been recorded.
- its **Tag**, if it differs from the name
- its **Range** (*Min – Max*), if limits are set

> **Tip:** Press and hold a value to select and copy it.

**To close the panel,** tap **✕**, tap the dimmed area above it, or press the Android back button.

---

## 8. Notifications

### Receiving notifications

Once you've allowed notifications, you get alerts from ESL LIMS:

- **when the app is open,** as a banner at the top of the screen
- **when the app is in the background or closed,** in your phone's notification tray

The app saves every notification on your device so you can read it later, up to the **100 most recent**. Older ones are deleted on their own.

### Opening a notification

Tap a notification in the tray or banner:

- If it's linked to a form, the app opens that form's **Samples** screen.
- Otherwise, the app opens the **Notifications** screen.

The notification is marked as **read**.

If you tap a notification while signed out, sign in and the app takes you to it.

### The Notifications screen

Open it from the side menu or the 🔔 bell.

| Action | How |
|---|---|
| Show all or only unread | Tap **All** or **Unread (n)** at the top. |
| Open a notification | Tap it. Unread notifications have a blue dot and bold title. |
| Mark one as read or unread | Tap the ✉ envelope icon on the right of the card. |
| Mark all as read | Tap **Mark all read**. It appears only when you have unread notifications. |
| Delete one | **Press and hold** the notification, then tap **Delete**. |
| Delete all | Tap **Clear all**, then confirm. |
| Refresh the list | Pull the list down. |

Each card shows when the notification arrived: *Just now*, *5m ago*, *3h ago*, *2d ago*, or a date for anything older than a week.

> **Note:** Notifications are stored only on this device. They're deleted when you **log out**, and they don't carry over to other devices.

---

## 9. Sending a notification

Use **Send Notification** in the side menu to send a push notification to everyone in one or more **roles**, for example all ANALYSTs.

### Steps

1. **Write the message**
   - **Title**: up to 100 characters, for example *Sample ready for analysis*.
   - **Message**: up to 500 characters. A counter shows how many you've used.
2. **Link a form (optional)**
   Under **Open form on tap**, tap a form chip, for example *Blast Furnace Sample* or *Micro Analysis*. When recipients tap the notification, that form opens. Tap the chip again to remove the link.
3. **Choose recipients**
   - Each row is a role, with the number of devices registered under it, for example *ANALYST — 8 recipients*.
   - Tap a row to select it. A check mark appears.
   - To find a role quickly, type in **Search by role**.
   - Tap **Select all** or **Deselect all** to select or clear every role in the list. If you've searched, only the matching roles are affected.
   - The heading shows how many devices are selected out of the total, for example *Recipients (8/23)*.
   - Pull down to refresh the list.
4. Tap **Send to n**.

When it's sent, a green message confirms *"Notification sent to n recipients."* and the form clears so you can write a new one.

### Good to know

- Recipients are **devices**, not people. Someone signed in on two phones counts as two recipients. Each device counts once, even if the server lists it more than once.
- Devices registered with an older version of the app may appear under **No role**, at the bottom of the list.
- **Send** stays greyed out until you've entered a title and a message and selected at least one role.
- When users log out, their devices stop receiving notifications. When they sign in again, their devices are registered again.

---

## 10. Signing out

1. Open the side menu.
2. Tap **Logout** at the bottom.
3. Tap **Logout** again to confirm, or **Cancel** to stay signed in.

Signing out:

- removes your saved session from the device
- stops this device from receiving notifications for your account
- **deletes all saved notifications** on this device

> Always sign out before you hand a shared device to someone else.

---

## 11. Messages and what they mean

### Sign-in

| Message | Meaning / what to do |
|---|---|
| *Please enter your User ID and Password.* | One of the fields is empty. |
| *Invalid User ID or Password.* | Check your details. Passwords are case-sensitive. |
| *Can't reach the server. Check your connection and try again.* | No network, no VPN, or the server is down or slow to respond. It gives up after 15 seconds. |
| Any other text | The message comes from the LIMS server. If it doesn't make sense, pass it to your administrator. |

### Send Notification

| Message | Meaning / what to do |
|---|---|
| *Enter a title and a message.* | Both fields are required. |
| *Select at least one role.* | Choose one or more recipient roles. |
| *Couldn't load devices. Check your connection and try again.* | Tap **Retry** or pull down to refresh. |
| *API Unauthorised. Please contact support.* | The notification server rejected the request. Contact support. |
| *Couldn't send the notification.* | Try again. If it keeps failing, contact support. |

### Data screens

| Message | Meaning |
|---|---|
| *Location / Plant / Labs not found* | That part of the setup is missing on the server. See [section 4](#when-nothing-is-found). |
| *Lab not found* | The lab no longer exists, or the link is out of date. |
| *No items found* | The lab has no units yet. |
| *Sample not found* | The item has no sample definitions, or the samples couldn't be loaded. |
| *Parameters not found* | The sample has no parameters set up. |

---

## 12. Troubleshooting

| Problem | Try this |
|---|---|
| **I'm sent back to the login screen** | Your session expired or was revoked. Sign in again. |
| **Labs, items or samples don't load** | Check your connection or VPN. Go back and open the screen again. A spinning indicator means data is still loading. |
| **"Sample not found" but I expect data** | The request may have failed because of the network. Go back and reopen the item. If it keeps happening, contact your administrator. |
| **I don't get notifications** | 1. Check notifications are allowed in **Settings › Notifications › ESL LIMS**. 2. On Android, also check that the **ESL LIMS Notifications** channel is turned on. 3. Sign out and sign in again to register the device again. 4. Make sure you're using a real device, not an emulator. |
| **My notification list is empty after signing in** | Notifications are deleted when you sign out. This is expected. |
| **A notification opened "Samples" with nothing in it** | The form linked to that notification may have no samples at your plant. |
| **The app shows the wrong plant** | The app always shows the first plant at your location. Contact your administrator if you need a different one. |
| **Unread count looks wrong** | Pull down on the Notifications screen to refresh, or close and reopen the app. |

---

## 13. FAQ

**Can I enter or change results in the app?**
No. This version is **read-only** for LIMS data. You can view labs, items, samples and parameters, but you can't edit them.

**Does the app work offline?**
No. Lab and sample data loads live each time. Only your sign-in session and saved notifications are stored on the device.

**Who can use "Send Notification"?**
Everyone who is signed in can see it in this version. Your organization may have its own rules about who should use it.

**Is my password stored on the phone?**
No. Only the sign-in token the server returns and your basic profile (name, role, company) are stored, in the device's secure storage (Android Keystore or iOS Keychain).

**Can I use the app in a web browser?**
There is a web build, but it's limited: you have to sign in again every time you reload the page, and push notifications aren't available. Use the Android or iOS app.

---

## Appendix A: For administrators and IT

This appendix is for staff who install, configure or support the app.

### Package identifiers

| Platform | ID |
|---|---|
| Android package | `com.aondigicon.esllims` |
| iOS bundle ID | `com.aondigicon.esllims` |
| Deep link scheme | `esllims://` |

### Backend services

The app talks to two servers. Their addresses are set at build time in `.env`:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_APPLICATION_URL` | LIMS application API: sign-in (`/login`) and data (`/ErpServices`, LIMS SQL connection) |
| `EXPO_PUBLIC_APP_ID` | Application ID sent with sign-in. **Sign-in fails if it's missing.** |
| `EXPO_PUBLIC_NOTIFICATION_URL` | Notification API: device registration (`/FirebaseToken`) and sending (`/FirebaseToken/send`) |

`.env` has separate entries for **development** and **quality**. Comment one out and uncomment the other before building.

### LIMS methods used

| Screen | Method | Input |
|---|---|---|
| Home (location) | `LocationAct` | `CompanyId` |
| Home (plants) | `PlantAct` | `LocationId` |
| Home (labs) | `SBUMasterACT` | `PlantId` |
| Lab | `SubSBUACT` | `DeptId` (lab ID) |
| Samples | `SampleAll` | `Id` (item ID) |

All calls except sign-in send `Authorization: Bearer <token>`. When the server responds with **HTTP 401**, the app signs the user out.

### Push notifications

- Delivered through **Firebase Cloud Messaging**. The config files are `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
- Android channel ID: **`esllims_default`** (high importance). Send this as `channelId` from the backend.
- To make a notification open a form, put `formid` (or `formId` / `FormId`) in the data payload. You can also add `lab` (the lab ID).
- The *Open form on tap* list on **Send Notification** comes from `jsondata/SbuMobile.json`.
- Each device registers with `userlog = {"USER_NAME": "...", "ROLE_NAME": "..."}`. The Send Notification screen uses this to group devices by role.

### Building and releasing

The app is built with Expo and EAS:

```bash
npm install
npx expo start                                # development server (needs a development build)
npx eas-cli@latest build --profile development # internal dev client
npx eas-cli@latest build --profile preview     # internal test build
npx eas-cli@latest build --profile production  # store build (build number increases automatically)
npx eas-cli@latest submit --profile production
```

The app uses native modules (Firebase, Notifee), so it **doesn't run in Expo Go**. Use a development build.

---

## Appendix B: Glossary

| Term | Meaning |
|---|---|
| **LIMS** | Laboratory Information Management System |
| **Location** | A company site |
| **Plant** | A production plant at a location |
| **Lab / SBU** | A laboratory (strategic business unit) within a plant, for example CENTRAL LAB |
| **Item / Sub-SBU** | A unit or department within a lab |
| **Sample** | A sample definition: what is sampled, how often, and which parameters are tested |
| **Parameter** | One test or reading on a sample, with a value, unit and acceptable range |
| **F_Year** | Financial year, for example 2025-26 |
| **Role** | Your job function in LIMS, for example ADMIN, LAB HEAD or ANALYST |
| **FCM token** | The ID Firebase uses to send push notifications to one device |
