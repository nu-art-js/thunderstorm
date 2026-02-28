import type {ApiDef, GeneralApi} from '@nu-art/api-types';
import {
	ApiDef_AssetUploader,
	ModuleBase_AssetUploader,
	TempSignedUrl,
	UI_Asset,
	type IAssetUploadRequest,
	type UploaderConfig
} from '@nu-art/file-upload-shared';

export type ServerFilesToUpload = UI_Asset & {
	file: Buffer
};

type Config = UploaderConfig & { baseUrl?: string };

function createFetchRequest<API extends GeneralApi>(apiDef: ApiDef<API>, baseUrl: string): IAssetUploadRequest<API> {
	let url = '';
	const headers: Record<string, string> = {};
	let body: unknown;

	return {
		setUrl(u: string) {
			url = u;
			return this;
		},
		setHeader(key: string, value: string) {
			headers[key] = value;
			return this;
		},
		setTimeout(_ms: number) {
			return this;
		},
		setBody(b: unknown) {
			body = b;
			return this;
		},
		setOnProgressListener(_cb: (ev: { loaded: number; total?: number }) => void) {
			return this;
		},
		executeSync: async () => {
			const fullUrl = url || `${(baseUrl || '').replace(/\/$/, '')}/${apiDef.path}`;
			const res = await fetch(fullUrl, {
				method: (apiDef as { method?: string }).method ?? 'POST',
				headers: {'Content-Type': 'application/json', ...headers},
				body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
			});
			if (!res.ok)
				throw new Error(`Request failed: ${res.status} ${res.statusText}`);
			const text = await res.text();
			return text ? JSON.parse(text) : undefined;
		},
		execute(cb: (response: unknown) => void) {
			this.executeSync().then(cb).catch((e: unknown) => { throw e; });
		}
	};
}

export class ModuleBE_AssetUploader_Class
	extends ModuleBase_AssetUploader<Config> {

	constructor() {
		super();
		const baseUrl = () => this.config?.baseUrl ?? '';
		this.vv1 = {
			getUploadUrl: (body: UI_Asset[]) => createFetchRequest(ApiDef_AssetUploader.getUploadUrl as ApiDef<GeneralApi>, baseUrl()).setBody(body),
			processAssetManually: (params: { feId?: string }) => {
				const query: Record<string, string> = {};
				if (params.feId)
					query.feId = params.feId;
				const req = createFetchRequest(
					{method: 'GET', path: ApiDef_AssetUploader.processAssetManually.path} as ApiDef<GeneralApi>,
					baseUrl()
				);
				const path = ApiDef_AssetUploader.processAssetManually.path;
				return {
					...req,
					setUrlParam(key: string, value: string) {
						query[key] = value;
						return this;
					},
					execute() {
						const qs = Object.keys(query).length ? '?' + Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
						req.setUrl(`${(baseUrl() || '').replace(/\/$/, '')}/${path}${qs}`);
						void req.executeSync();
					}
				};
			}
		} as ModuleBase_AssetUploader<Config>['vv1'];
	}

	createRequest<API extends GeneralApi>(uploadFile: ApiDef<API>): IAssetUploadRequest<API> {
		let url = '';
		const headers: Record<string, string> = {};
		let body: unknown;
		return {
			setUrl(u: string) {
				url = u;
				return this;
			},
			setHeader(key: string, value: string) {
				headers[key] = value;
				return this;
			},
			setTimeout(_ms: number) {
				return this;
			},
			setBody(b: unknown) {
				body = b;
				return this;
			},
			setOnProgressListener(_cb: (ev: { loaded: number; total?: number }) => void) {
				return this;
			},
			executeSync: async () => {
				const res = await fetch(url, {
					method: (uploadFile as { method?: string }).method ?? 'PUT',
					headers: {...headers},
					body: body !== undefined ? JSON.stringify(body) : undefined
				});
				if (!res.ok)
					throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
				return res.json().catch(() => undefined);
			},
			execute(cb: (response: unknown) => void) {
				this.executeSync().then(cb).catch((e: unknown) => { throw e; });
			}
		};
	}

	upload(files: ServerFilesToUpload[]): UI_Asset[] {
		return this.uploadImpl(files);
	}

	protected async subscribeToPush(_toSubscribe: TempSignedUrl[]): Promise<void> {
		// Not used in backend flow
	}
}

export const ModuleBE_AssetUploader = new ModuleBE_AssetUploader_Class();
