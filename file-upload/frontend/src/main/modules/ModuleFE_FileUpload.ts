import {Module, Minute} from '@nu-art/ts-common';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {HttpMethod} from '@nu-art/api-types';
import {HttpClient} from '@nu-art/http-client';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {
	ApiDef_FileUpload,
	AssetStatus,
	DB_Asset,
	PendingUpload,
	UploadProgressEvent,
	UploadRequest,
} from '@nu-art/file-upload-shared';


export type TransferDirection = 'upload' | 'download';

export type FileTransferPhase =
	| 'requesting'
	| 'uploading'
	| 'confirming'
	| 'preparing'
	| 'downloading'
	| 'completed'
	| 'failed';

export type FileTransferState = {
	assetId?: string
	name: string
	progress: number
	phase: FileTransferPhase
	direction: TransferDirection
	asset?: DB_Asset
	error?: string
};

export interface OnFileTransferStateChanged {
	__onFileTransferStateChanged: (state: FileTransferState) => void;
}

type UploadQueueItem = {
	pending: PendingUpload
	file: File
	state: FileTransferState
};

type DownloadQueueItem = {
	assetId: string
	name: string
	state: FileTransferState
};

const DefaultParallelTransfers = 3;

export class ModuleFE_FileUpload_Class
	extends Module {

	private readonly dispatch_transferStateChange = new ThunderDispatcher<OnFileTransferStateChanged, '__onFileTransferStateChanged'>('__onFileTransferStateChanged');

	// ── Upload ──

	async upload(files: File[], key: string, isPublic: boolean = false): Promise<DB_Asset[]> {
		const requests: UploadRequest[] = files.map(file => ({
			name: file.name,
			mimeType: file.type,
			key,
			public: isPublic,
		}));

		const states: FileTransferState[] = files.map(f => ({
			name: f.name,
			progress: 0,
			phase: 'requesting' as const,
			direction: 'upload' as const,
		}));
		states.forEach(s => this.dispatch_transferStateChange.dispatchUI(s));

		const pendingUploads = await HttpClient.default
			.createRequest(ApiDef_FileUpload.requestUpload)
			.setBodyAsJson(requests)
			.execute();

		const results: DB_Asset[] = [];
		const queue = new QueueV2<UploadQueueItem, DB_Asset>('file-upload', (item) => this.processUpload(item))
			.setParallelCount(DefaultParallelTransfers);

		for (let i = 0; i < pendingUploads.length; i++) {
			const state = states[i];
			state.assetId = pendingUploads[i].asset._id;

			queue.addItemImpl(
				{pending: pendingUploads[i], file: files[i], state},
				(asset) => results.push(asset),
			);
		}

		await queue.executeSync();
		return results;
	}

	private async processUpload(item: UploadQueueItem): Promise<DB_Asset> {
		const {pending, file, state} = item;

		state.phase = 'uploading';
		this.dispatch_transferStateChange.dispatchUI(state);

		try {
			await this.uploadToStorage(pending, file, (ev) => {
				state.progress = ev.total ? ev.loaded / ev.total : 0;
				this.dispatch_transferStateChange.dispatchUI(state);
			});

			state.phase = 'confirming';
			state.progress = 1;
			this.dispatch_transferStateChange.dispatchUI(state);

			const response = await HttpClient.default
				.createRequest(ApiDef_FileUpload.confirmUpload)
				.setBodyAsJson({_id: pending.asset._id})
				.execute();

			if (response.error || response.asset.status === AssetStatus.Failed) {
				state.phase = 'failed';
				state.error = response.error ?? 'Validation failed';
				state.asset = response.asset;
				this.dispatch_transferStateChange.dispatchUI(state);
				throw new Error(state.error);
			}

			state.phase = 'completed';
			state.asset = response.asset;
			this.dispatch_transferStateChange.dispatchUI(state);
			return response.asset;
		} catch (e: any) {
			if (state.phase !== 'failed') {
				state.phase = 'failed';
				state.error = e.message ?? 'Upload failed';
				this.dispatch_transferStateChange.dispatchUI(state);
			}
			throw e;
		}
	}

	private async uploadToStorage(pending: PendingUpload, file: File, onProgress: (ev: UploadProgressEvent) => void): Promise<void> {
		await HttpClient.default
			.createRequest({method: HttpMethod.PUT, path: ''})
			.setUrl(pending.signedUrl)
			.setHeader('Content-Type', pending.asset.mimeType)
			.setTimeout(20 * Minute)
			.setBody(file)
			.setOnProgressListener(onProgress)
			.execute();
	}

	// ── Download ──

	async download(assetIds: string[], fileNames?: string[]): Promise<void> {
		const states: FileTransferState[] = assetIds.map((id, i) => ({
			assetId: id,
			name: fileNames?.[i] ?? id,
			progress: 0,
			phase: 'requesting' as const,
			direction: 'download' as const,
		}));
		states.forEach(s => this.dispatch_transferStateChange.dispatchUI(s));

		const queue = new QueueV2<DownloadQueueItem, void>('file-download', (item) => this.processDownload(item))
			.setParallelCount(DefaultParallelTransfers);

		for (let i = 0; i < assetIds.length; i++) {
			queue.addItemImpl({assetId: assetIds[i], name: states[i].name, state: states[i]});
		}

		await queue.executeSync();
	}

	private async processDownload(item: DownloadQueueItem): Promise<void> {
		const {assetId, name, state} = item;

		try {
			state.phase = 'preparing';
			this.dispatch_transferStateChange.dispatchUI(state);

			const signedUrl = await this.getReadSignedUrl(assetId);

			state.phase = 'downloading';
			this.dispatch_transferStateChange.dispatchUI(state);

			const response = await fetch(signedUrl);
			if (!response.ok)
				throw new Error(`Download failed: ${response.status} ${response.statusText}`);

			const contentLength = response.headers.get('content-length');
			const total = contentLength ? parseInt(contentLength, 10) : undefined;
			const reader = response.body?.getReader();

			if (!reader)
				throw new Error('Response body is not readable');

			const chunks: ArrayBuffer[] = [];
			let loaded = 0;

			while (true) {
				const {done, value} = await reader.read();
				if (done)
					break;

				chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
				loaded += value.length;
				state.progress = total ? loaded / total : 0;
				this.dispatch_transferStateChange.dispatchUI(state);
			}

			const blob = new Blob(chunks);
			this.triggerBrowserSave(blob, name);

			state.phase = 'completed';
			state.progress = 1;
			this.dispatch_transferStateChange.dispatchUI(state);
		} catch (e: any) {
			state.phase = 'failed';
			state.error = e.message ?? 'Download failed';
			this.dispatch_transferStateChange.dispatchUI(state);
			throw e;
		}
	}

	private triggerBrowserSave(blob: Blob, fileName: string) {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	// ── Shared ──

	async getReadSignedUrl(assetId: string): Promise<string> {
		const response = await HttpClient.default
			.createRequest(ApiDef_FileUpload.getReadSignedUrl)
			.setBodyAsJson({_id: assetId})
			.execute();
		return response.signedUrl;
	}
}

export const ModuleFE_FileUpload = new ModuleFE_FileUpload_Class();
