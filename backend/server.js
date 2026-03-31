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

// Template rendering function
const renderTemplate = (template, context) => {
  if (typeof template === "string") {
    // Replace {{key}} patterns with values from context
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const keys = path.split(".");
      let value = context;
      for (const key of keys) {
        value = value?.[key];
      }
      return value !== undefined ? value : match;
    });
  }

  if (typeof template === "object" && template !== null) {
    if (Array.isArray(template)) {
      return template.map((item) => renderTemplate(item, context));
    }

    const result = {};
    for (const [key, val] of Object.entries(template)) {
      result[key] = renderTemplate(val, context);
    }
    return result;
  }

  return template;
};

// Mount routes
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

  app[method](routePath, (req, res) => {
    // Build context for templating
    const context = {
      input: req.method === "GET" ? req.query : req.body || {},
      query: req.query,
      body: req.body || {},
      headers: req.headers,
      params: req.params
    };

    // Render response template
    const response = renderTemplate(responseBody, context);

    res.status(200).json(response);
  });

  mountedCount += 1;
  console.log(`Mounted ${method.toUpperCase()} ${routePath}`);
});

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "Nodite Data Plane",
    status: "running",
    routesConfigured: routes.length,
    routesMounted: mountedCount,
    endpoints: routes.map((r) => `${r.method} ${r.path}`)
  });
});

app.listen(PORT, () => {
  console.log(`Nodite Data Plane listening on http://localhost:${PORT}`);
  // Run with hot-reload when shared config changes:
  // npx nodemon --watch ../shared/nodite.json server.js
});
