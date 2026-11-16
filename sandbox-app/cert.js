// Generates a self-signed certificate for localhost (via openssl) on first start.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, 'certs');
const keyFile = path.join(dir, 'key.pem');
const certFile = path.join(dir, 'cert.pem');

function loadOrCreateCert() {
  if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '825',
      '-keyout', keyFile, '-out', certFile, '-subj', '/CN=localhost',
      '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ], { stdio: 'ignore' });
  }
  return { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) };
}

module.exports = { loadOrCreateCert };
