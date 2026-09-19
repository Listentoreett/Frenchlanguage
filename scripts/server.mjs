import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const root = resolve(scriptDir, "..");
const startPort = Number.parseInt(process.env.PORT || "5173", 10);
const host = "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".md": "text/markdown; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm"
};

function sendFile(response, filePath) {
  const type = mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

function safePath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const requested = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, requested));

  if (!filePath.startsWith(root)) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  return filePath;
}

const server = createServer((request, response) => {
  const filePath = safePath(request.url || "/");

  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  sendFile(response, filePath);
});

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < startPort + 20) {
      listen(port + 1);
      return;
    }

    console.error(error.message);
    process.exit(1);
  });

  server.listen(port, host, () => {
    console.log(`French Learning Plan running at http://${host}:${port}/app/pronunciation-coach/`);
  });
}

listen(startPort);
