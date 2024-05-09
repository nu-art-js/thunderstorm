import {DBProto_ShortUrl} from './types';
import {DBDef_V3, tsValidateGeneralUrl, tsValidateShortUrl, tsValidateString} from '@nu-art/ts-common';


const Validator_ModifiableProps: DBProto_ShortUrl['modifiablePropsValidator'] = {
	fullUrl: tsValidateGeneralUrl(true),
	title: tsValidateString(),
	description: tsValidateString(undefined, false),
};

const Validator_GeneratedProps: DBProto_ShortUrl['generatedPropsValidator'] = {
	_shortUrl: tsValidateShortUrl(),
};

export const DBDef_ShortUrl: DBDef_V3<DBProto_ShortUrl> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'short-url',
	entityName: 'short-url',
	frontend: {
		group: 'app',
		name: 'short-url'
	},
	backend: {
		name: 'short-url'
	}
};