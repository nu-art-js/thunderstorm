import {
	convertUpperCamelCase,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateExists,
	tsValidateMustExist,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateRegexp,
	tsValidateString
} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {AssetDBGroup, DBProto_Assets, DBProto_AssetsDeleted, DBProto_AssetsTemp} from './types.js';


const Validator_ModifiableProps: DBProto_Assets['modifiablePropsValidator'] = {
	name: tsValidateRegexp(/^.{3,}$/),
	ext: tsValidateExists(true),
	feId: tsValidateExists(true),
	mimeType: tsValidateExists(true),
	key: tsValidateExists(true),
};

const Validator_GeneratedProps: DBProto_Assets['generatedPropsValidator'] = {
	md5Hash: tsValidateExists(false),
	path: tsValidateExists(true),
	bucketName: tsValidateExists(true),
	public: tsValidateBoolean(false),
	metadata: tsValidateDynamicObject(tsValidateMustExist, tsValidateString(), false),
	timestamp: tsValidateNumber(),
	signedUrl: tsValidateNonMandatoryObject({
			url: tsValidateString(),
			validUntil: tsValidateNumber()
		}
	)
};

const AssetVersions: ['1.0.2', '1.0.1', '1.0.0'] = ['1.0.2', '1.0.1', '1.0.0'];

const GeneratedProps: DBProto_Assets['generatedProps'] = ['signedUrl', 'timestamp', 'md5Hash', 'path', 'bucketName', 'public', 'metadata'];

const BaseDef = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: GeneratedProps,
	versions: AssetVersions,
	frontend: { group: AssetDBGroup, name: 'asset' },
	backend: { name: 'assets' },
};

export const DBDef_Assets: Database<DBProto_Assets> = {
	...BaseDef,
	dbKey: 'assets',
	entityName: convertUpperCamelCase('Assets', '-').toLowerCase(),
	backend: { name: 'assets' },
};

export const DBDef_TempAssets: Database<DBProto_AssetsTemp> = {
	...BaseDef,
	dbKey: 'assets-temp',
	entityName: 'assets-temp',
	frontend: { group: AssetDBGroup, name: 'temp' },
	backend: { name: 'assets-temp' },
};

export const DBDef_TempDeleted: Database<DBProto_AssetsDeleted> = {
	...BaseDef,
	dbKey: 'assets-deleted',
	entityName: 'assets-deleted',
	frontend: { group: AssetDBGroup, name: 'deleted' },
	backend: { name: 'assets-deleted' },
};
