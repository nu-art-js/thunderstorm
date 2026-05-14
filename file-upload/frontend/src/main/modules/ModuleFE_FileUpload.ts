import {Module, Minute} from '@nu-art/ts-common';
import {QueueV2} from '@nu-art/ts-common/utils/queue-v2';
import {HttpMethod} from '@nu-art/api-types';
import {HttpClient} from '@nu-art/http-client';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {
	ApiDef_FileUpload,
	DB_Asset,
	PendingUpload,
	UploadProgressEvent,
	UploadRequest,
} from '@nu-art/file-upload-shared';


export type FileUploadState = {
	assetId?: string
	name: string
	progress: number
	phase: 'requesting' | 'uploading' | 'confirming' | 'completed' | 'failed'
	asset?: DB_Asset
	error?: string
};

export interface OnFileUploadStateChanged {
	__onFileUploadStateChanged: (state: FileUploadState) => void;
}

type UploadQueueItem = {
	pending: PendingUpload
	file: File
	state: FileUploadState
};

const DefaultParallelUploads = 3;

export class ModuleFE_FileUpload_Class
	extends Module {

	private readonly dispatch_uploadStateChange = new ThunderDispatcher<OnFileUploadStateChanged, '__onFileUploadStateChanged'>('__onFileUploadStateChanged');

	async upload(files: File[], key: string, isPublic: boolean = false): Promise<DB_Asset[]> {
		const requests: UploadRequest[] = files.map(file => ({
			name: file.name,
			mimeType: file.type,
			key,
			public: isPublic,
		}));

		const states: FileUploadState[] = files.map(f => ({
			name: f.name,
			progress: 0,
			phase: 'requesting' as const,
		}));
		states.forEach(s => this.dispatch_uploadStateChange.dispatchUI(s));

		const pendingUploads = await HttpClient.default
			.createRequest(ApiDef_FileUpload.requestUpload)
			.setBodyAsJson(requests)
			.execute();

		const results: DB_Asset[] = [];
		const queue = new QueueV2<UploadQueueItem, DB_Asset>('file-upload', (item) => this.processUpload(item))
			.setParallelCount(DefaultParallelUploads);

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
		this.dispatch_uploadStateChange.dispatchUI(state);

		try {
			await this.uploadToStorage(pending, file, (ev) => {
				state.progress = ev.total ? ev.loaded / ev.total : 0;
				this.dispatch_uploadStateChange.dispatchUI(state);
			});

			state.phase = 'confirming';
			state.progress = 1;
			this.dispatch_uploadStateChange.dispatchUI(state);

			const confirmed = await HttpClient.default
				.createRequest(ApiDef_FileUpload.confirmUpload)
				.setBodyAsJson({_id: pending.asset._id})
				.execute();

			state.phase = 'completed';
			state.asset = confirmed;
			this.dispatch_uploadStateChange.dispatchUI(state);
			return confirmed;
		} catch (e: any) {
			state.phase = 'failed';
			state.error = e.message ?? 'Upload failed';
			this.dispatch_uploadStateChange.dispatchUI(state);
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

	async getReadSignedUrl(assetId: string): Promise<string> {
		const response = await HttpClient.default
			.createRequest(ApiDef_FileUpload.getReadSignedUrl)
			.setBodyAsJson({_id: assetId})
			.execute();
		return response.signedUrl;
	}
}

export const ModuleFE_FileUpload = new ModuleFE_FileUpload_Class();
