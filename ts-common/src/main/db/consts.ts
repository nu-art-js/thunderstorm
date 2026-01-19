import {DBPointer} from '../utils/types.js';
import {MetadataObject} from './types.js';

/** Default unique key name for database objects */
export const Const_UniqueKey = '_id';
/** Array containing the default unique key */
export const Const_UniqueKeys = [Const_UniqueKey];

/** Default database version string */
export const DefaultDBVersion = '1.0.0';
/** Placeholder ID for new items before they're saved */
export const DefaultNewItemId = '##NEWITEM##';

/**
 * Metadata definition for DBPointer type.
 * 
 * Describes the structure and validation rules for database pointer objects.
 */
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