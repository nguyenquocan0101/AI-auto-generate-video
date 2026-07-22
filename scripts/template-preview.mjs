import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";

const templatesRoot = join(process.cwd(), "templates");
const requestedTemplate = process.argv.slice(2).find((arg) => !arg.startsWith("--")) || "ct-short-clip";
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = Number(portArg?.split("=")[1] || 4260);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
};

function validTemplate(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id) && existsSync(join(templatesRoot, id, "index.html"));
}

function fileWithin(base, value) {
  const file = normalize(join(base, value));
  return relative(base, file).startsWith("..") ? null : file;
}

function injectPreview(html, variables, width, height) {
  const payload = JSON.stringify(variables).replace(/</g, "\\u003c");
  const variablesScript = `<script>window.__hyperframes={getVariables:function(){return ${payload};}};</script>`;
  const fitScript = `<style>html,body{width:100vw!important;height:100vh!important;margin:0!important;overflow:hidden!important;background:#05070a!important}#root{position:absolute!important;transform-origin:top left!important}</style><script>(function(){var r=document.getElementById('root');function fit(){var s=Math.min(innerWidth/${width},innerHeight/${height});r.style.transform='scale('+s+')';r.style.left=((innerWidth-${width}*s)/2)+'px';r.style.top=((innerHeight-${height}*s)/2)+'px'}addEventListener('resize',fit);fit()})();</script>`;
  return html.replace("</head>", `${variablesScript}</head>`).replace("</body>", `${fitScript}</body>`);
}

function gallery() {
  const templates = readdirSync(templatesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(templatesRoot, entry.name, "preview.json")))
    .map((entry) => entry.name);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Template preview</title><style>body{margin:0;padding:32px;background:#090c10;color:#eef1f4;font:15px Segoe UI,sans-serif}h1{font-size:24px}.list{display:grid;gap:10px;max-width:720px}a{padding:14px 16px;border:1px solid #323943;border-radius:9px;color:#c9b8ff;background:#151a20;text-decoration:none}a:hover{border-color:#8b5cf6}</style></head><body><h1>HyperFrames template preview</h1><div class="list">${templates.map((id) => `<a href="/t/${id}/?aspect=9:16">${id} · 9:16</a>`).join("")}</div></body></html>`;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.pathname === "/") {
    if (validTemplate(requestedTemplate)) {
      response.writeHead(302, { Location: `/t/${requestedTemplate}/?aspect=9:16` }).end();
    } else {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(gallery());
    }
    return;
  }

  const match = /^\/t\/([a-zA-Z0-9_-]+)\/(.*)$/.exec(url.pathname);
  if (!match || !validTemplate(match[1])) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Template not found");
    return;
  }

  const templateId = match[1];
  const templateRoot = join(templatesRoot, templateId);
  const relativePath = decodeURIComponent(match[2]);
  if (!relativePath) {
    const portrait = url.searchParams.get("aspect") !== "16:9";
    const portraitEntry = join(templateRoot, "compositions", "portrait.html");
    const entry = portrait && existsSync(portraitEntry) ? portraitEntry : join(templateRoot, "index.html");
    const previewPath = join(templateRoot, "preview.json");
    const variables = existsSync(previewPath) ? JSON.parse(readFileSync(previewPath, "utf8")) : {};
    const html = injectPreview(readFileSync(entry, "utf8"), variables, portrait ? 1080 : 1920, portrait ? 1920 : 1080);
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }).end(html);
    return;
  }

  const file = fileWithin(templateRoot, relativePath);
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[extname(file)] || "application/octet-stream",
    "Content-Length": statSync(file).size,
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Template preview: http://127.0.0.1:${port}/t/${requestedTemplate}/?aspect=9:16`);
  console.log(`Landscape:       http://127.0.0.1:${port}/t/${requestedTemplate}/?aspect=16:9`);
});
