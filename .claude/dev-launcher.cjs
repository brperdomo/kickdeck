// Launcher: proxy that binds port immediately, then spawns the real server
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const PORT = 5050;
const REAL_PORT = 5051;
const PROJECT_DIR = '/Users/bperdomo/MatchProAI';
const tsxBin = path.join(PROJECT_DIR, 'node_modules', '.bin', 'tsx');

let serverReady = false;
let child = null;

// Proxy HTTP requests
const proxy = http.createServer((req, res) => {
  if (!serverReady) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body style="background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h2>KickDeck is starting...</h2></body></html>');
    return;
  }
  const options = {
    hostname: '127.0.0.1',
    port: REAL_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', () => {
    res.writeHead(502);
    res.end('Backend not ready');
  });
  req.pipe(proxyReq, { end: true });
});

// Proxy WebSocket upgrades (needed for Vite HMR)
proxy.on('upgrade', (req, socket, head) => {
  if (!serverReady) {
    socket.destroy();
    return;
  }
  const conn = net.connect(REAL_PORT, '127.0.0.1', () => {
    conn.write(
      req.method + ' ' + req.url + ' HTTP/' + req.httpVersion + '\r\n'
    );
    Object.keys(req.headers).forEach((key) => {
      conn.write(key + ': ' + req.headers[key] + '\r\n');
    });
    conn.write('\r\n');
    if (head && head.length) conn.write(head);
    conn.pipe(socket);
    socket.pipe(conn);
  });
  conn.on('error', () => socket.destroy());
  socket.on('error', () => conn.destroy());
});

proxy.listen(PORT, () => {
  console.log('[launcher] Proxy on port ' + PORT);

  // Start the real server AFTER the proxy is listening
  const env = Object.assign({}, process.env, { PORT: String(REAL_PORT) });
  child = spawn(tsxBin, ['server/index.ts'], {
    cwd: PROJECT_DIR,
    env: env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', function(data) {
    var msg = data.toString();
    process.stdout.write(msg);
    if (msg.indexOf('Server ready') !== -1 || msg.indexOf('Server started successfully') !== -1) {
      serverReady = true;
      console.log('[launcher] Backend ready');
    }
  });

  child.stderr.on('data', function(data) {
    process.stdout.write(data);
  });

  child.on('exit', function(code) {
    console.log('[launcher] Backend exited: ' + code);
  });
});

process.on('SIGTERM', function() { if (child) child.kill(); process.exit(0); });
process.on('SIGINT', function() { if (child) child.kill(); process.exit(0); });
