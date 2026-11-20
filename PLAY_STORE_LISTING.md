# ESL LIMS — Google Play Store Listing

## App name (max 30 characters)

```
ESL LIMS
```

## Short description (max 80 characters)

```
Track lab samples, results and alerts from ESL LIMS on your phone.
```

*(66 characters)*

## Full description (max 4,000 characters)

```
ESL LIMS brings your laboratory to your phone. It's the mobile companion to the ESL Laboratory Information Management System (LIMS), built for analysts, lab heads and plant teams who need to follow samples and results away from their desk.

TRACK EVERY SAMPLE
• See every registered sample in one list, with its sample code, lab, shift and registration time.
• Know at a glance how far each sample has got: Registered, Received, Analysed or Published.
• Search by sample code, lab, shift, financial year, status or person.
• Filter by lab and sort newest or oldest first.
• Pull down to refresh, or let the list update itself every minute.

SEE RESULTS IN DETAIL
• Open any sample to see who registered, received, analysed and published it, and when.
• View every parameter reading with its value, unit, tag and acceptable range.
• Press and hold to copy a sample code or value.

GET ALERTED AS SAMPLES MOVE
• Receive an alert when a sample is registered, received, analysed or published, showing who did it.
• Each alert lists the sample's parameters with their values and units.
• Tap an alert to jump straight to the sample's details.
• Several changes at once arrive as one tidy summary instead of a flood of alerts.

BROWSE YOUR LABS
• See every lab at your plant, each with its own icon and color.
• Drill down from lab to unit to sample definitions, with frequency, analysis code, retention period and parameter ranges.
• Filter sample definitions by financial year.

STAY IN TOUCH WITH YOUR TEAM
• Send a notification to everyone in one or more roles, for example all analysts.
• Keep every notification in one place, with unread counts, mark-as-read and delete.

YOUR SETTINGS, YOUR WAY
• Turn alerts, sound and vibration on or off.
• Notifications stay in the in-app list even when pop-up alerts are off.

SECURE BY DESIGN
• Sign in with your existing ESL LIMS User ID and password.
• Your session is kept in the device's secure storage; your password is never saved on the phone.
• Signing out removes your session and saved notifications from the device.

PLEASE NOTE
• ESL LIMS is for organizations that use the ESL Laboratory Information Management System. You need an ESL LIMS account to sign in; ask your administrator if you don't have one.
• An internet connection is required. If your LIMS server is on your company network, connect to it (for example over VPN) first.
• This version is read-only for LIMS data: you can view samples and results but not edit them.
• Background alerts depend on your phone's battery and background settings, so they may arrive a few minutes late when the app is closed.
```

*(about 2,700 characters)*

## Release notes — "What's new" (max 500 characters)

### Version 1.0.0

```
Welcome to ESL LIMS on mobile!
• Samples: see every registered sample, its status (Registered, Received, Analysed, Published) and full parameter results. Search, filter by lab and sort.
• Sample alerts: get notified when a sample moves to the next step, with its readings. Tap to open it.
• Browse your plant's labs and sample definitions.
• Send notifications to colleagues by role.
• Settings for alerts, sound and vibration.
```

---

## Notes for the Play Console

- **Category:** Business (or Productivity).
- **Target audience:** adults (18+); this is a workplace app.
- **Login for review:** Google's reviewers can't sign in without an account. Under **App content › App access**, choose *All or some functionality is restricted* and give them a test User ID and password, plus any VPN or network steps they need.
- **Data safety form:** the app collects the user's name, role and company ID (from sign-in) and a device push token for notifications. Data is sent to your LIMS and notification servers over the network and isn't shared with third parties other than Google Firebase Cloud Messaging for delivery.
- **Permissions:** `POST_NOTIFICATIONS` (to show alerts). The background sample check uses Android's WorkManager; no extra permission declaration is needed for it.
