import {Database} from '@nu-art/db-api-shared';
import {tsValidateGeneralUrl, tsValidateShortUrl, tsValidateString} from '@nu-art/ts-common';
import {DatabaseDef_ShortUrl} from './types.js';

const modifiablePropsValidator: DatabaseDef_ShortUrl['modifiablePropsValidator'] = {
	fullUrl: tsValidateGeneralUrl(true),
	title: tsValidateString(),
	description: tsValidateString(undefined, false),
};

const generatedPropsValidator: DatabaseDef_ShortUrl['generatedPropsValidator'] = {
	_shortUrl: tsValidateShortUrl(),
};

export const DBDef_ShortUrl: Database<DatabaseDef_ShortUrl> = {
	dbKey: 'short-url',
	entityName: 'short-url',
	modifiablePropsValidator,
	generatedPropsValidator,
	generatedProps: ['_shortUrl'],
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {
		group: 'app',
		name: 'short-url'
	},
	backend: {
		name: 'short-url'
	}
};
