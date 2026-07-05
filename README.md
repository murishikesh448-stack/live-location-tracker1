# TIRUCHENDUR MURUGAN TEMPLE

A visitor-friendly temple guide with rotating visual sections, temple details, and a live chariot tracking map.

## For real tracking from different networks

The chariot phone and viewer phone do **not** need to be on the same Wi-Fi, but the tracker server must be reachable on the public internet over HTTPS.

Deploy these files to a public HTTPS host that can run Node.js, for example Render, Railway, Fly.io, a VPS, or any Node hosting service:

```powershell
node server.js
```

After deployment, use the public URL:

```text
https://your-tracker-domain.com/
```

Open the main website from that public URL, then choose `Track Car`. On the phone travelling with the chariot, open:

```text
https://your-tracker-domain.com/share-location.html
```

Tap `Start Sharing` and allow location permission. The sharing page shows the phone location on its own Leaflet map, and the public website map reads the latest coordinate from:

```text
https://your-tracker-domain.com/api/chariot-location
```

## If the website and API are hosted separately

Open the website with the API URL in the query string:

```text
https://your-website-domain.com/?api=https://your-tracker-domain.com
```

The sharing page will keep the same API setting:

```text
https://your-website-domain.com/share-location.html?api=https://your-tracker-domain.com
```

The Node server includes CORS headers. You can restrict allowed origins when deploying:

```powershell
$env:CORS_ORIGIN="https://your-website-domain.com"
node server.js
```

## Local testing only

```powershell
node server.js
```

Then open `http://localhost:4173/` on this computer. Local network URLs are only for testing; they are not needed for real public tracking.

## Storage

The tracker stores only the latest coordinate in `chariot-location.json`.


## Current Published Frontends

Location sharing page:

```text
https://locationsend.netlify.app/
```

Main website:

```text
https://tiruchendur-car-festival.netlify.app/
```

Use both with the same tracker API URL:

```text
https://locationsend.netlify.app/?api=https://your-tracker-domain.com
https://tiruchendur-car-festival.netlify.app/?api=https://your-tracker-domain.com#chariot
```

If you open the sharing page from this code, its `View Live Chariot Map` button now points to:

```text
https://tiruchendur-car-festival.netlify.app/#chariot
```

## Active Tracker API

Current tracker API:

```text
https://live-location-tracker1.onrender.com
```

Use these live URLs:

```text
https://locationsend.netlify.app/?api=https://live-location-tracker1.onrender.com
https://tiruchendur-car-festival.netlify.app/?api=https://live-location-tracker1.onrender.com#chariot
```

