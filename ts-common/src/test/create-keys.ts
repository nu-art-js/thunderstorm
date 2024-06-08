import forge from 'node-forge';
import fs from 'fs';

// Generate a key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a certificate
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;

// Set certificate attributes
cert.serialNumber = new Date().getTime().toString(16); // Use a unique serial number based on timestamp
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// Certificate attributes
const attrs = [{
	shortName: 'CN',
	value: 'quai.md'
}, {
	shortName: 'C',
	value: 'US'
}, {
	shortName: 'ST',
	value: 'Delaware'
}, {
	shortName: 'L',
	value: 'Lewes'
}, {
	shortName: 'O',
	value: 'Quai.MD Inc.'
}, {
	shortName: 'OU',
	value: 'quai/epic-integration'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);

// Self-sign certificate
cert.sign(keys.privateKey);

// Convert to PEM format
const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);
const certPem = forge.pki.certificateToPem(cert);

// Write to files
const pathToOutput = '/Users/tacb0ss/dev/quai/test/quai-web/.trash/keys';
const name = 'epic--vendor-services--sandbox';
if (!fs.existsSync(pathToOutput))
	fs.mkdirSync(pathToOutput, {recursive: true});

fs.writeFileSync(`${pathToOutput}/${name}-public-cert`, certPem, {encoding: 'utf-8'});
fs.writeFileSync(`${pathToOutput}/${name}-public`, publicKeyPem, {encoding: 'utf-8'});
fs.writeFileSync(`${pathToOutput}/${name}-private`, privateKeyPem, {encoding: 'utf-8'});


