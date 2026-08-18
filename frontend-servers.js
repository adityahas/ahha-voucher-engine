const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function createStaticServer(rootDirectory, port, name) {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(rootDirectory, urlPath === '/' ? 'index.html' : urlPath);

    // Prevent directory traversal
    if (!filePath.startsWith(rootDirectory)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      // If file doesn't exist or is a directory, fallback to index.html (SPA routing)
      if (err || stats.isDirectory()) {
        filePath = path.join(rootDirectory, 'index.html');
      }

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        res.end(content);
      });
    });
  });

  server.listen(port, () => {
    console.log(`[${name}] Static server listening on http://localhost:${port}`);
  });

  return server;
}

const baseDir = __dirname;
const cmsDir = fs.existsSync(path.join(baseDir, 'frontend-cms-dist'))
  ? path.join(baseDir, 'frontend-cms-dist')
  : path.join(baseDir, 'apps', 'frontend-cms', 'dist');

const consumerDir = fs.existsSync(path.join(baseDir, 'frontend-consumer-dist'))
  ? path.join(baseDir, 'frontend-consumer-dist')
  : path.join(baseDir, 'apps', 'frontend-consumer', 'dist');

createStaticServer(cmsDir, 5173, 'CMS-Admin');
createStaticServer(consumerDir, 5174, 'Consumer-Store');
