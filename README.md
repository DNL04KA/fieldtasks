# FieldTasks

An offline-first React Native app for field employees: daily work tasks with locations, attachments, sync and history.

Create, plan, track, and review daily work tasks with locations, attachments,
status changes, offline support, and a full action history. Built as a React
Native test assignment.

## Main features

- **Task CRUD** — title, description, due date/time, location (address + optional
  coordinates or quick-pick presets), image/PDF attachments, statuses
  (New / In Progress / Completed / Cancelled) with validation and friendly errors.
- **List, sorting, search** — sort by date added / due date / status, filter by
  status, search by title, overdue highlighting, empty states.
- **Detail screen** — full info, status switching, attachment gallery with graceful
  handling of missing files, per-task history, delete with confirmation.
- **Local notifications** — reminder 30 minutes before the due date, with a
  documented fallback and a demo mode for the review video (see below).
- **Map** — tasks with coordinates shown as markers colored by status; tapping a
  marker callout opens the task.
- **History tab** — persistent log of creation, edits, status changes, attachment
  changes, deletion, and sync events with timestamps.
- **Offline-first + mock sync** — everything works offline via AsyncStorage; when
  the connection returns, changes sync to a json-server backend with per-task
  Pending / Synced / Failed indicators.
- **Light/dark theme** with a visible toggle in Settings.

## Tech stack & reasoning

| Concern          | Choice                              | Why                                                                 |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework        | Expo (SDK 57) + TypeScript (strict) | Fastest reliable path to an installable APK in 48h; typed end to end |
| State            | Zustand                             | Tiny API, no boilerplate, selector-based re-renders, easy to test    |
| Local storage    | AsyncStorage                        | Data volume is small; a thin typed storage layer keeps it swappable  |
| Navigation       | React Navigation (stack + tabs)     | De facto standard                                                    |
| Map              | Leaflet + OpenStreetMap (WebView)   | No API key needed; Google Maps SDK crashes on Android without one    |
| Notifications    | expo-notifications                  | Local scheduled notifications with channels on Android               |
| Attachments      | expo-image-picker / document-picker | Images required, PDFs as bonus; files copied into app storage        |
| Connectivity     | @react-native-community/netinfo     | Online/offline detection triggers auto-sync                          |
| Mock server      | json-server                         | Assignment-recommended                                               |

## Project structure

```
src/
├── api/          # mock server client + base URL config
├── components/   # reusable UI (TaskCard, FormField, Chip, AttachmentGallery, …)
├── constants.ts  # candidate identity, status labels, presets, notification timings
├── hooks/        # useNetworkSync (NetInfo → store)
├── navigation/   # stack + tabs, typed param lists
├── screens/      # TaskList, TaskForm, TaskDetail, Map, History, Settings
├── services/     # syncService, notificationService, attachmentService
├── storage/      # AsyncStorage persistence layer
├── store/        # Zustand store (single writer) + selectors
├── theme/        # light/dark palettes + ThemeProvider
├── types/        # domain models
└── utils/        # validation, datetime, id
mock-server/      # json-server db.json + instructions
```

## Getting started

```bash
npm install

# 1. start the mock server (terminal A)
npm run mock-server

# 2. start the app (terminal B)
npm run android        # or: npm start, then open in a dev build
```

The dev client / APK is required (not Expo Go) because of notifications and the
WebView-based map. See build instructions below.

**Mock server URL:** the app defaults to `http://10.0.2.2:3001` on Android
emulators and `http://localhost:3001` on iOS. For a **physical device**, set your
computer's LAN IP in [src/api/config.ts](src/api/config.ts) and keep both devices
on the same network. Details: [mock-server/README.md](mock-server/README.md).

## Building the APK

```bash
# one-time: install EAS CLI and log in
npm install -g eas-cli
eas login

# build a production APK
eas build --platform android --profile preview
```

Or locally without EAS (requires Android SDK):

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Map keys

Not needed. The map is Leaflet + OpenStreetMap inside a WebView, so no Google
Maps API key (and no billing-enabled Google Cloud account) is required. This
was a deliberate switch: the Google Maps SDK hard-crashes Android release
builds when no API key is present.

## Architecture notes

- **Storage** — [src/storage/taskStorage.ts](src/storage/taskStorage.ts) is a thin
  typed layer over AsyncStorage. The Zustand store is the single writer: every
  mutation produces new immutable state and persists it in the background, so the
  UI never waits on disk.
- **Sync** — [src/services/syncService.ts](src/services/syncService.ts) runs a
  two-phase sync: (1) push every locally `pending`/`failed` task (PUT with POST
  fallback, DELETE for tombstones), (2) pull the server list and merge.
  **Conflict resolution is last-write-wins on `updatedAt`**, with one guard:
  a task that has unsynced local changes is never overwritten by the pull.
  Deletions use tombstones (`deleted: true`) so they reach the server even if the
  user deleted the task while offline. Sync runs after every mutation, when the
  network comes back (NetInfo), via pull-to-refresh, and manually from Settings.
- **Notifications** — [src/services/notificationService.ts](src/services/notificationService.ts)
  schedules a local notification 30 minutes before the due date.
  *Fallback behavior:* if the due date is less than 30 minutes away, the reminder
  fires ~10 seconds after saving and the user sees an explanatory message. If the
  due date is in the past, nothing is scheduled (the form also rejects past dates).
  *Demo mode* (Settings → "Demo notification mode") makes reminders for newly
  saved tasks fire after 45 seconds — used in the video.
- **Attachments** — picked files are **copied into the app's document directory**,
  so they survive restarts and gallery deletions. The gallery checks file
  existence and shows a clear "file unavailable" placeholder instead of crashing.
- **Map/location** — manual address is required; coordinates are optional manual
  input or one of the predefined quick locations (real geocoding is out of scope
  per the assignment). Only tasks with coordinates appear on the map.
- **Theme** — a small ThemeProvider with `light`/`dark` palettes persisted in
  AsyncStorage; every component reads colors from context.

## Tests

```bash
npm test        # 17 unit tests: validation, sync merge logic, store race handling
npm run typecheck
```

## Known limitations & trade-offs

- `android.usesCleartextTraffic: true` is enabled because the mock json-server
  speaks plain HTTP and Android release builds block cleartext by default
  (found during live APK testing — sync silently failed in the release build
  until this was allowed). A production app would use HTTPS and drop the flag.

- Last-write-wins by `updatedAt` relies on device clocks; a real backend would use
  server timestamps or version vectors.
- Attachment binaries are not uploaded to the mock server — only metadata syncs
  (json-server has no file storage). Files live on-device.
- Sync status is per-task; there is no retry queue with backoff — a failed sync is
  retried on the next trigger (mutation, reconnect, manual).
- The demo notification mode applies to tasks saved *after* enabling it.
- History log is capped at 300 entries to bound storage growth.
- In a multi-device scenario the LWW pull would replace local attachment file
  URIs with another device's paths; acceptable here because the mock server is
  single-user — a real backend needs actual attachment upload/download.
- Notification scheduling and the store commit are not atomic: if the app is
  killed between them, an orphaned reminder can fire once for an unsaved change.
- ESLint (`eslint-plugin-react-hooks`) is not configured — hook correctness was
  verified by review and unit tests; adding `eslint-config-expo` would be the
  first follow-up for a production project.
- Map markers live inside a WebView (Leaflet) and are not reachable by screen
  readers — the Map screen ships a task-pill fallback bar as an accessible
  alternative path to open tasks.
- Map tiles need internet (OpenStreetMap); offline, the map is blank but the
  task-pill fallback bar still opens tasks.

## AI / tooling disclosure

AI assistance (Claude) was used for scaffolding, boilerplate, and this README.
All architectural decisions (offline-first store as single writer, two-phase
sync with tombstones and LWW, attachment copy-to-app-storage) were reviewed and
are fully understood by me; I can walk through any module in a follow-up review.
