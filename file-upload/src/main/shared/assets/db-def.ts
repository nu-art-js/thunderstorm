import {
	convertUpperCamelCase,
	DBDef_V3,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateExists,
	tsValidateMustExist,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateRegexp,
	tsValidateString
} from '@nu-art/ts-common';
import {DBProto_Assets} from './types';


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

export const DBDef_Assets: DBDef_V3<DBProto_Assets> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.2', '1.0.1', '1.0.0'],
	dbName: 'assets',
	entityName: convertUpperCamelCase('Assets', '-').toLowerCase(),
};

export const DBDef_TempAssets: DBDef_V3<DBProto_Assets> = {
	...DBDef_Assets,
	dbName: 'assets-temp',
	entityName: 'assets-temp',
};

export const DBDef_TempDeleted: DBDef_V3<DBProto_Assets> = {
	...DBDef_Assets,
	dbName: 'assets-deleted',
	entityName: 'assets-deleted',
};