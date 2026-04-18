#!/usr/bin/env node
/**
 * Generates a self-signed TLS certificate for local-network HTTPS.
 * Browsers require HTTPS to allow getUserMedia (microphone) on non-localhost origins.
 *
 * Run once:  npm run generate-cert
 * Then:      npm run dev
 */

const { execSync } = require("child_process");
const { networkInterfaces } = require("os");
const fs = require("fs");
const path = require("path");

// ── Detect ALL local network IPs ──────────────────────────────────────────────
function getLocalIPs() {
  const ips = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) ips.push(addr.address);
    }
  }
  return ips.length ? ips : ["127.0.0.1"];
}

const localIPs = getLocalIPs();
const certsDir = path.join(__dirname, "..", "certs");
const certFile = path.join(certsDir, "cert.pem");
const keyFile  = path.join(certsDir, "key.pem");
const cnfFile  = path.join(certsDir, "san.cnf");

fs.mkdirSync(certsDir, { recursive: true });

// ── Write OpenSSL config with Subject Alternative Names ───────────────────────
const ipLines = ["127.0.0.1", ...localIPs]
  .filter((ip, i, arr) => arr.indexOf(ip) === i) // dedupe
  .map((ip, i) => `IP.${i + 1}  = ${ip}`)
  .join("\n");

const cnf = `
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = v3_req
x509_extensions    = v3_req

[dn]
CN = localhost

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment

[alt_names]
DNS.1 = localhost
${ipLines}
`;

fs.writeFileSync(cnfFile, cnf.trimStart());

// ── Generate the certificate ───────────────────────────────────────────────────
try {
  execSync(
    `openssl req -x509 -newkey rsa:2048 -days 365 -nodes` +
    ` -keyout "${keyFile}" -out "${certFile}" -config "${cnfFile}"`,
    { stdio: "inherit" }
  );
  fs.unlinkSync(cnfFile); // cleanup temp config
  console.log(`\n✓ Certificate generated for localhost and ${localIPs.join(", ")}`);
  console.log(`  ${certFile}`);
  console.log(`  ${keyFile}`);
  console.log(`\nStart the server: npm run dev`);
  localIPs.forEach(ip => console.log(`Then open: https://${ip}:6969`));
  console.log(`\nNote: Your browser will show a security warning (self-signed cert).`);
  console.log(`      Click "Advanced" → "Proceed" once to allow microphone access.\n`);
} catch {
  console.error("\n✗ openssl not found. Install it with: brew install openssl\n");
  process.exit(1);
}
