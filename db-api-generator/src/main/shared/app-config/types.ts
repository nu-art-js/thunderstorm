import {DB_Object} from '@nu-art/ts-common';
import {AppConfigKey_BE} from '../../backend/ModuleBE_AppConfig';

export type InferType<T> = T extends AppConfigKey_BE<infer ValueType> ? ValueType : never;

export type DB_AppConfig = DB_Object & {
	key: string;
	data: any;
}
