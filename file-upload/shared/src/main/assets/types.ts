import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {TS_Object} from '@nu-art/ts-common';

export const AssetDBGroup = 'asset';

const Assets_DbKey = 'assets';
const AssetsTemp_DbKey = 'assets-temp';
const AssetsDeleted_DbKey = 'assets-deleted';

type VersionTypes_Asset = {
	'1.0.0': DB_Asset
	'1.0.1': DB_Asset
	'1.0.2': DB_Asset
};
type Versions = VersionsDeclaration<['1.0.2', '1.0.1', '1.0.0'], VersionTypes_Asset>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedKeys =
	'signedUrl' |
	'timestamp' |
	'md5Hash' |
	'path' |
	'bucketName' |
	'public' |
	'metadata';

/** Shared entity fields for assets (all three collections). */
export type AssetData = {
	key: string
	name: string
	feId: string
	ext: string
	mimeType: string
	timestamp: number
	md5Hash?: string
	path: string
	bucketName: string
	public?: boolean
	metadata?: TS_Object
	signedUrl?: {
		url: string
		validUntil: number
	}
};

export type DB_Asset = DB_Object<typeof Assets_DbKey> & AssetData;
type DB_AssetTemp = DB_Object<typeof AssetsTemp_DbKey> & AssetData;
type DB_AssetDeleted = DB_Object<typeof AssetsDeleted_DbKey> & AssetData;

export type DBProto_Assets = DB_Prototype<DB_ProtoSeed<DB_Asset, typeof Assets_DbKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type DBProto_AssetsTemp = DB_Prototype<DB_ProtoSeed<DB_AssetTemp, typeof AssetsTemp_DbKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type DBProto_AssetsDeleted = DB_Prototype<DB_ProtoSeed<DB_AssetDeleted, typeof AssetsDeleted_DbKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;

export type UI_Asset = DBProto_Assets['uiType'];

/** Request shape for upload (name, mimeType, key?, public?, metadata?). */
export type Request_Uploader = {
	name: string
	mimeType: string
	key?: string
	public?: boolean
	metadata?: TS_Object
};

export type BaseUploaderFile = Request_Uploader & {
	feId: string
};

/** Minimal progress event for upload requests. */
export type UploadProgressEvent = { loaded: number; total?: number };

/** Minimal request handle for upload progress. */
export type ProgressableRequest = { setOnProgressListener?(cb: (ev: UploadProgressEvent) => void): void };
