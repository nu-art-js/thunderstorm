import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {TS_Object} from '@nu-art/ts-common';


export const AssetDBGroup = 'asset';

const Assets_DbKey = 'assets';

export enum AssetStatus {
	Pending = 'pending',
	Validated = 'validated',
	Failed = 'failed',
}

export type AssetData = {
	key: string
	name: string
	ext: string
	mimeType: string
	status: AssetStatus
	path: string
	bucketName: string
	md5Hash?: string
	public?: boolean
	metadata?: TS_Object
	signedUrl?: {
		url: string
		validUntil: number
	}
};

export type DB_Asset = DB_Object<typeof Assets_DbKey> & AssetData;

type VersionTypes_Asset = {
	'1.0.0': DB_Asset
};

type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Asset>;
type UniqueKeys = '_id';
type GeneratedKeys =
	'signedUrl'
	| 'md5Hash'
	| 'path'
	| 'bucketName'
	| 'status'
	| 'public'
	| 'metadata';

export type DatabaseDef_Assets = DB_Prototype<DB_ProtoSeed<DB_Asset, typeof Assets_DbKey, GeneratedKeys, Versions, UniqueKeys>>;
export type UI_Asset = DatabaseDef_Assets['uiType'];

export type UploadRequest = {
	name: string
	mimeType: string
	key?: string
	public?: boolean
	metadata?: TS_Object
};

export type PendingUpload = {
	signedUrl: string
	asset: DB_Asset
};

export type UploadProgressEvent = { loaded: number; total?: number };
