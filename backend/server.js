const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const configPath = path.resolve(__dirname, "..", "shared", "nodite.json");

app.use(cors());
app.use(express.json());

let config;
try {
  const rawConfig = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(rawConfig);
} catch (error) {
  console.error("Failed to load shared/nodite.json:", error.message);
  process.exit(1);
}

const routes = Array.isArray(config.routes) ? config.routes : [];
let mountedCount = 0;

routes.forEach((route) => {
  const method = String(route.method || "").toLowerCase();
  const routePath = route.path;
  const responseBody = route.responseBody;

  if (!["get", "post"].includes(method)) {
    console.warn(`Skipping route ${route.id}: unsupported method '${route.method}'`);
    return;
  }

  if (typeof routePath !== "string" || !routePath.startsWith("/")) {
    console.warn(`Skipping route ${route.id}: invalid path '${route.path}'`);
    return;
  }

  app[method](routePath, (_req, res) => {
    res.status(200).json(responseBody ?? {});
  });

  mountedCount += 1;
  console.log(`Mounted ${method.toUpperCase()} ${routePath}`);
});

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "Nodite Data Plane",
    status: "running",
    routesConfigured: routes.length,
    routesMounted: mountedCount
  });
});

app.listen(PORT, () => {
  console.log(`Nodite Data Plane listening on http://localhost:${PORT}`);
  // Run with hot-reload when shared config changes:
  // npx nodemon --watch ../shared/nodite.json server.js
});
