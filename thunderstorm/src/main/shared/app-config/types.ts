import {DB_Object} from '@nu-art/ts-common';

export type DB_AppConfig = DB_Object & {
	key: string;
	data: any;
}
