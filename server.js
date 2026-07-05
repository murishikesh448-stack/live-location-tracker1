const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const locationFile = path.join(root, "chariot-location.json");
const allowedOrigin = process.env.CORS_ORIGIN || "*";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/chariot-location" && req.method === "GET") {
      return sendJson(res, readLocation());
    }

    if (url.pathname === "/api/chariot-location" && req.method === "POST") {
      const payload = await readJsonBody(req);
      const location = normalizeLocation(payload);
      fs.writeFileSync(locationFile, JSON.stringify(location, null, 2));
      return sendJson(res, { ok: true, location });
    }

    if (url.pathname.startsWith("/api/")) {
      return sendJson(res, { error: "Not found" }, 404);
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    return sendJson(res, { error: error.message || "Server error" }, 500);
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Chariot tracker server running at http://localhost:${port}/`);
  console.log("For different networks, deploy this server to a public HTTPS host.");
  console.log("Then open the site with: https://your-site.com/?api=https://your-tracker-domain.com");
  getLanAddresses().forEach((address) => {
    console.log(`Local testing URL: http://${address}:${port}/`);
  });
});

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function serveStatic(requestPath, res) {
  const cleanPath = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  const filePath = path.normalize(path.join(root, cleanPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function readLocation() {
  if (!fs.existsSync(locationFile)) {
    return { hasLocation: false };
  }

  try {
    const location = JSON.parse(fs.readFileSync(locationFile, "utf8"));
    return { hasLocation: true, ...location };
  } catch (error) {
    return { hasLocation: false };
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 32) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeLocation(payload) {
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid latitude");
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("Invalid longitude");
  }

  return {
    lat,
    lng,
    accuracy: Number(payload.accuracy) || 0,
    heading: Number.isFinite(Number(payload.heading)) ? Number(payload.heading) : null,
    speed: Number.isFinite(Number(payload.speed)) ? Number(payload.speed) : null,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}
