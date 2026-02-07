#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const certDir = path.join(repoRoot, 'certs');

const hosts = process.argv.slice(2);
if (hosts.length === 0) {
  hosts.push('localhost', '127.0.0.1', '::1');
}

fs.mkdirSync(certDir, { recursive: true });

const keyFile = path.join(certDir, 'localhost-key.pem');
const certFile = path.join(certDir, 'localhost-cert.pem');

const which = spawnSync('mkcert', ['-help'], { stdio: 'ignore' });
if (which.error) {
  console.error('mkcert is not installed.');
  console.error('Install it on macOS with: brew install mkcert nss');
  console.error('Then run once: mkcert -install');
  process.exit(1);
}

console.log('Generating dev HTTPS certificate with mkcert...');
console.log(`Hosts: ${hosts.join(', ')}`);

const install = spawnSync('mkcert', ['-install'], { stdio: 'inherit' });
if (install.status !== 0) {
  process.exit(install.status ?? 1);
}

const gen = spawnSync(
  'mkcert',
  ['-key-file', keyFile, '-cert-file', certFile, ...hosts],
  { stdio: 'inherit' }
);

if (gen.status !== 0) {
  process.exit(gen.status ?? 1);
}

console.log(`\nWrote:\n- ${keyFile}\n- ${certFile}`);