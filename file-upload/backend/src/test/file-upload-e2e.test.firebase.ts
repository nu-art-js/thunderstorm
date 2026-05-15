import {expect} from 'chai';
import {Application, generateHex, MB, ModuleManager} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {ModuleBE_Auth} from '@nu-art/google-services-backend';
import {AssetStatus, DB_Asset} from '@nu-art/file-upload-shared';
import {ModuleBE_FileUpload} from '../main/modules/ModuleBE_FileUpload.js';
import {StorageAdapter_InMemory} from './StorageAdapter_InMemory.js';


const storageAdapter = new StorageAdapter_InMemory();

const emulatorConfig = {
	project_id: generateHex(4),
	databaseURL: `http://localhost:8102/?ns=test-file-upload`,
	isEmulator: true,
};

const ValidatorKey_Image = 'test-image';
const ValidatorKey_Document = 'test-document';
const ValidatorKey_Custom = 'test-custom';

const registerTestValidators = () => {
	ModuleBE_FileUpload.registerValidator(ValidatorKey_Image, {
		allowedMimeTypes: ['image/png', 'image/jpeg'],
		maxSize: 5 * MB,
	});

	ModuleBE_FileUpload.registerValidator(ValidatorKey_Document, {
		allowedMimeTypes: ['text/plain', 'application/pdf'],
		minSize: 10,
		maxSize: 1 * MB,
	});

	ModuleBE_FileUpload.registerValidator(ValidatorKey_Custom, {
		validator: async (metadata, asset, fileBuffer) => {
			const content = fileBuffer.toString('utf-8');
			if (!content.startsWith('VALID'))
				throw new Error('File must start with VALID');

			return {ext: 'txt', mime: 'text/plain'};
		},
	});
};

const simulateUploadToStorage = (asset: DB_Asset, content: Buffer) => {
	storageAdapter.writeFile(asset.path, content);
};

describe('File Upload — E2E', function () {
	this.timeout(30_000);

	before(function () {
		ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: emulatorConfig}});
		ModuleBE_FileUpload.setStorageAdapter(storageAdapter);

		const app = new Application();
		app.addModulePack([ModuleBE_Firebase, ModuleBE_FileUpload]);
		app.init();

		registerTestValidators();
	});

	afterEach(function () {
		storageAdapter.clear();
	});

	after(async function () {
		await ModuleManager.destroy();
	});

	// ── 1. Happy path: upload → confirm → validated ──

	describe('Happy path', () => {
		it('requestUpload → simulateUpload → confirmUpload yields validated asset', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'photo.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			expect(pending.signedUrl).to.be.a('string');
			expect(pending.asset.status).to.equal(AssetStatus.Pending);
			expect(pending.asset.name).to.equal('photo.png');

			simulateUploadToStorage(pending.asset, Buffer.from('fake-png-content'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.undefined;
			expect(response.asset.status).to.equal(AssetStatus.Validated);
			expect(response.asset.md5Hash).to.be.a('string');
		});

		it('uploads multiple files in a single request', async () => {
			const pendingUploads = await ModuleBE_FileUpload.requestUpload([
				{name: 'file1.png', mimeType: 'image/png', key: ValidatorKey_Image},
				{name: 'file2.png', mimeType: 'image/png', key: ValidatorKey_Image},
			]);

			expect(pendingUploads).to.have.length(2);

			for (const pending of pendingUploads) {
				simulateUploadToStorage(pending.asset, Buffer.from('content'));
			}

			const response1 = await ModuleBE_FileUpload.confirmUpload({_id: pendingUploads[0].asset._id});
			const response2 = await ModuleBE_FileUpload.confirmUpload({_id: pendingUploads[1].asset._id});

			expect(response1.asset.status).to.equal(AssetStatus.Validated);
			expect(response2.asset.status).to.equal(AssetStatus.Validated);
			expect(response1.asset._id).to.not.equal(response2.asset._id);
		});
	});

	// ── 2. MIME rejection ──

	describe('MIME validation', () => {
		it('rejects upload with disallowed MIME type', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'spreadsheet.csv',
				mimeType: 'text/csv',
				key: ValidatorKey_Image,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('csv,data'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.a('string');
			expect(response.error).to.include('MIME type');
			expect(response.asset.status).to.equal(AssetStatus.Failed);
		});
	});

	// ── 3. Size validation ──

	describe('Size validation', () => {
		it('rejects file smaller than minSize', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'tiny.txt',
				mimeType: 'text/plain',
				key: ValidatorKey_Document,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('short'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.a('string');
			expect(response.error).to.include('size');
			expect(response.asset.status).to.equal(AssetStatus.Failed);
		});

		it('rejects file larger than maxSize', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'huge.txt',
				mimeType: 'text/plain',
				key: ValidatorKey_Document,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.alloc(2 * MB, 'x'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.a('string');
			expect(response.error).to.include('size');
			expect(response.asset.status).to.equal(AssetStatus.Failed);
		});

		it('accepts file within size range', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'normal.txt',
				mimeType: 'text/plain',
				key: ValidatorKey_Document,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('This content is long enough to pass the min size check'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.undefined;
			expect(response.asset.status).to.equal(AssetStatus.Validated);
		});
	});

	// ── 4. File not found in storage ──

	describe('File not found', () => {
		it('fails confirmation when file was not uploaded to storage', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'ghost.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.a('string');
			expect(response.error).to.include('not found');
			expect(response.asset.status).to.equal(AssetStatus.Failed);
		});
	});

	// ── 5. Missing validator ──

	describe('Missing validator', () => {
		it('throws when requesting upload with unregistered key', async () => {
			try {
				await ModuleBE_FileUpload.requestUpload([{
					name: 'mystery.xyz',
					mimeType: 'application/octet-stream',
					key: 'unregistered-key',
				}]);
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.message).to.include('Missing validator');
			}
		});
	});

	// ── 6. Custom validator ──

	describe('Custom validator', () => {
		it('passes when custom validator succeeds', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'custom.txt',
				mimeType: 'text/plain',
				key: ValidatorKey_Custom,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('VALID content here'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.undefined;
			expect(response.asset.status).to.equal(AssetStatus.Validated);
		});

		it('fails when custom validator throws', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'invalid-custom.txt',
				mimeType: 'text/plain',
				key: ValidatorKey_Custom,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('INVALID content'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.a('string');
			expect(response.error).to.include('Custom validator failed');
			expect(response.asset.status).to.equal(AssetStatus.Failed);
		});
	});

	// ── 7. Confirm non-pending asset ──

	describe('Confirm non-pending', () => {
		it('fails when confirming an already-validated asset', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'already-done.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('content'));

			const first = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});
			expect(first.asset.status).to.equal(AssetStatus.Validated);

			const second = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});
			expect(second.error).to.be.a('string');
			expect(second.error).to.include('not in pending status');
		});
	});

	// ── 8. Make public flow ──

	describe('Make public', () => {
		it('calls makePublic on storage when asset is public', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'public-file.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
				public: true,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('public-content'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.undefined;
			expect(response.asset.status).to.equal(AssetStatus.Validated);
			expect(storageAdapter.isPublic(pending.asset.path)).to.be.true;
		});

		it('does not call makePublic when asset is not public', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'private-file.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
				public: false,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('private-content'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.error).to.be.undefined;
			expect(storageAdapter.isPublic(pending.asset.path)).to.be.false;
		});
	});

	// ── 9. Read signed URL ──

	describe('Read signed URL', () => {
		it('returns a signed URL for a validated asset', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'readable.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('readable-content'));
			await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			const result = await ModuleBE_FileUpload.getReadSignedUrl({_id: pending.asset._id});

			expect(result.signedUrl).to.be.a('string');
			expect(result.signedUrl).to.include(pending.asset.path);
		});
	});

	// ── 10. Stale asset cleanup ──

	describe('Stale cleanup', () => {
		it('removes pending assets older than threshold', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'stale.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('stale-content'));

			await ModuleBE_FileUpload.cleanupStaleAssets(0);

			expect(await storageAdapter.fileExists(pending.asset.path)).to.be.false;
		});

		it('does not remove validated assets', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'valid.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
			}]);

			simulateUploadToStorage(pending.asset, Buffer.from('valid-content'));
			await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			await ModuleBE_FileUpload.cleanupStaleAssets(0);

			expect(await storageAdapter.fileExists(pending.asset.path)).to.be.true;
		});
	});

	// ── 11. Validator registration edge cases ──

	describe('Validator registration', () => {
		it('allows re-registering the same config instance', () => {
			const config = {allowedMimeTypes: ['text/html']};
			ModuleBE_FileUpload.registerValidator('idempotent-key', config);
			expect(() => ModuleBE_FileUpload.registerValidator('idempotent-key', config)).to.not.throw();
		});

		it('throws when registering a different config for the same key', () => {
			ModuleBE_FileUpload.registerValidator('conflict-key', {allowedMimeTypes: ['text/plain']});
			expect(() => ModuleBE_FileUpload.registerValidator('conflict-key', {allowedMimeTypes: ['application/pdf']})).to.throw('already registered');
		});

		it('uses mimeType as key when request has no key', async () => {
			ModuleBE_FileUpload.registerValidator('text/plain', {
				allowedMimeTypes: ['text/plain'],
			});

			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'no-key.txt',
				mimeType: 'text/plain',
			}]);

			expect(pending.asset.key).to.equal('text/plain');

			simulateUploadToStorage(pending.asset, Buffer.from('content without explicit key'));

			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});
			expect(response.asset.status).to.equal(AssetStatus.Validated);
		});
	});

	// ── 12. Asset metadata ──

	describe('Metadata', () => {
		it('preserves custom metadata through the upload flow', async () => {
			const [pending] = await ModuleBE_FileUpload.requestUpload([{
				name: 'meta-file.png',
				mimeType: 'image/png',
				key: ValidatorKey_Image,
				metadata: {origin: 'test', category: 'screenshot'},
			}]);

			expect(pending.asset.metadata).to.deep.equal({origin: 'test', category: 'screenshot'});

			simulateUploadToStorage(pending.asset, Buffer.from('meta-content'));
			const response = await ModuleBE_FileUpload.confirmUpload({_id: pending.asset._id});

			expect(response.asset.metadata).to.deep.equal({origin: 'test', category: 'screenshot'});
		});
	});
});
