import {
	convertUpperCamelCase,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateExists,
	tsValidateMustExist,
	tsValidateNonMandatoryObject,
	tsValidateNumber,
	tsValidateRegexp,
	tsValidateString,
} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {AssetDBGroup, DatabaseDef_Assets} from './types.js';


const Validator_ModifiableProps: DatabaseDef_Assets['modifiablePropsValidator'] = {
	name: tsValidateRegexp(/^.{3,}$/),
	ext: tsValidateExists(true),
	mimeType: tsValidateExists(true),
	key: tsValidateExists(true),
};

const Validator_GeneratedProps: DatabaseDef_Assets['generatedPropsValidator'] = {
	md5Hash: tsValidateExists(false),
	path: tsValidateExists(true),
	bucketName: tsValidateExists(true),
	status: tsValidateExists(true),
	public: tsValidateBoolean(false),
	metadata: tsValidateDynamicObject(tsValidateMustExist, tsValidateString(), false),
	signedUrl: tsValidateNonMandatoryObject({
		url: tsValidateString(),
		validUntil: tsValidateNumber(),
	}),
};

const GeneratedProps: DatabaseDef_Assets['generatedProps'] = ['signedUrl', 'md5Hash', 'path', 'bucketName', 'status', 'public', 'metadata'];

export const DBDef_Assets: Database<DatabaseDef_Assets> = {
	dbKey: 'assets',
	entityName: convertUpperCamelCase('Assets', '-').toLowerCase(),
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	generatedProps: GeneratedProps,
	versions: ['1.0.0'],
	frontend: {group: AssetDBGroup, name: 'asset'},
	backend: {name: 'assets'},
};
