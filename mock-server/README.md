# Mock REST server

A [json-server](https://github.com/typicode/json-server) instance that plays the role of
the company backend for offline synchronization.

## Run

```bash
npm run mock-server
```

This serves `db.json` on `http://0.0.0.0:3001` with a `/tasks` resource.

## Connectivity

| Client                | Base URL                        |
| --------------------- | ------------------------------- |
| Android emulator      | `http://10.0.2.2:3001` (default)|
| iOS simulator         | `http://localhost:3001`         |
| Physical device       | `http://<your LAN IP>:3001`     |

For a physical device, set your machine's LAN IP in `src/api/config.ts` and make sure
the phone and the computer are on the same network.

`db.json` ships with two sample tasks so the first sync pull has data to show.
