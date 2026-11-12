import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = process.argv[2]; const port = Number(process.argv[3] || 8099);
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  const tries = [p, p + ".html", path.join(p, "index.html")];
  // dynamic segments: /smartgrow/12 -> /smartgrow/[id].html
  const seg = p.split("/"); if (seg.length > 2) tries.push(seg.slice(0, -1).join("/") + "/[id].html");
  for (const t of tries) { const f = path.join(root, t); if (f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(200, { "content-type": "text/html" }); fs.createReadStream(path.join(root, "index.html")).pipe(res);
}).listen(port, () => console.log("serving", port));
