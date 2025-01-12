import {DBPointer} from '../utils/types';
import {MetadataObject} from './types';

export const Const_UniqueKey = '_id';
export const Const_UniqueKeys = [Const_UniqueKey];

export const DefaultDBVersion = '1.0.0';
export const DefaultNewItemId = '##NEWITEM##';

export const MetaData_DBPointer: MetadataObject<DBPointer> = {
	dbKey: {
		valueType: 'string',
		optional: false,
		description: 'The key by which we identify the collection the item is part of',
	},
	id: {
		valueType: 'string',
		optional: false,
		description: 'The unique id of the item',
	}
};