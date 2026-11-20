# ESL LIMS — Apple App Store Listing

Fields in App Store Connect. The full description and "What's New" text can be reused from [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md).

## Subtitle (max 30 characters)

```
Lab samples, results & alerts
```

## Promotional Text (max 170 characters)

Shown above the description. It can be changed at any time without submitting a new version.

```
Follow every lab sample from registration to published results. Get alerted as samples move, see parameter readings and open any sample in one tap.
```

## Keywords (max 100 characters, comma-separated, no spaces)

```
LIMS,laboratory,lab,sample,quality,analysis,results,QC,plant,analyst,test,parameter,ESL
```

## What's New in This Version (version 1.0.0)

```
Welcome to ESL LIMS on mobile!
• Samples: see every registered sample, its status (Registered, Received, Analysed, Published) and full parameter results. Search, filter by lab and sort.
• Sample alerts: get notified when a sample moves to the next step, with its readings. Tap to open it.
• Browse your plant's labs and sample definitions.
• Send notifications to colleagues by role.
• Settings for alerts, sound and vibration.
```

## App Review Information — Notes (max 4,000 characters)

Fill in the sign-in fields in the "Sign-in required" section with the demo account. Replace the [brackets] below before submitting.

```
ESL LIMS is the mobile companion to the ESL Laboratory Information Management System (LIMS). It is an internal business app for staff of organizations that use ESL LIMS; accounts are created by the organization's administrator, so there is no public sign-up.

DEMO ACCOUNT
The demo User ID and password are in the Sign-in Information fields. The account has sample data so every screen can be reviewed. [If the server needs VPN or an IP allow-list, describe access here.]

HOW TO REVIEW
1. Sign in with the demo account. Allow notifications when asked.
2. Home: shows the labs at the account's plant. Tap a lab, then an item, then a sample definition to see its parameters.
3. Side menu > Samples: lists registered samples with their status. Search, filter by lab, sort, and tap a sample to see its details and parameter readings.
4. Side menu > Notifications: saved notifications. Tap one to open the related sample or form.
5. Side menu > Send Notification: sends a push notification to devices registered under the selected roles.
6. Side menu > Settings: notification, sound and vibration switches, and Log out.

NOTIFICATIONS
Push notifications are delivered through Firebase Cloud Messaging. The app also checks the LIMS server for sample status changes (registered, received, analysed, published) every minute while open and, through a background task, periodically while in the background, and shows a local notification for each change. Notifications are only used for these work alerts, never for marketing.

DATA AND PRIVACY
The app sends the user's sign-in details to the organization's LIMS server and stores only the returned session token and basic profile (name, role, company) in the iOS Keychain. The password is not stored. Logging out deletes the session and saved notifications from the device. The app has no ads, tracking or in-app purchases.

CONTACT
[Name] · [email] · [phone]
```
