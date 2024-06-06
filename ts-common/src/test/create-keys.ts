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
	name: 'commonName',
	value: 'example.org'
}, {
	name: 'countryName',
	value: 'US'
}, {
	shortName: 'ST',
	value: 'California'
}, {
	name: 'localityName',
	value: 'San Francisco'
}, {
	name: 'organizationName',
	value: 'Example Organization'
}, {
	shortName: 'OU',
	value: 'IT Department'
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
fs.writeFileSync('private_key.pem', privateKeyPem);
fs.writeFileSync('public_key.pem', publicKeyPem);
fs.writeFileSync('public_key_cert.pem', certPem);

console.log('Private key:', privateKeyPem);
console.log('Public key:', publicKeyPem);
console.log('Certificate:', certPem);

const pathToOutput = '/Users/tacb0ss/dev/quai/test/quai-web/.trash/keys';
const name = 'epic--vendor-services--sandbox';
const {publicKey, privateKey} = generateKeyPair();
if (!fs.existsSync(pathToOutput))
	fs.mkdirSync(pathToOutput);

fs.writeFileSync(`${pathToOutput}/${name}-public`, publicKey, {encoding: 'utf-8'});
fs.writeFileSync(`${pathToOutput}/${name}-private`, privateKey, {encoding: 'utf-8'});


