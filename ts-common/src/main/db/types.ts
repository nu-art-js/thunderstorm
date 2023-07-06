import {DB_Object, OmitDBObject} from '../utils/types';
import {ValidatorTypeResolver} from '../validator/validator-core';


export type DBIndex<T extends DB_Object> = {
	id: string,
	keys: keyof T | (keyof T)[],
	params?: { multiEntry: boolean, unique: boolean }
};

export type Default_UniqueKey = '_id';

/**
 * @field version - First item in the array is current version, Must pass all past versions with the current, default version is 1.0.0
 */
export type DBDef<T extends DB_Object, Ks extends keyof T = Default_UniqueKey> = {
	validator: ValidatorTypeResolver<OmitDBObject<T>>;
	dbName: string;
	entityName: string;
	lockKeys?: (keyof T)[] // fallback to uniqueKeys, default ["_id"]
	uniqueKeys?: Ks[] // default ["_id"]
	/**
	 * First item in the array is the latest version. Last item in the array is the oldest version.
	 */
	versions?: string[]; // default ["1.0.0"]
	generatedProps?: (keyof T)[]
	indices?: DBIndex<T>[]
	metadata?: Metadata<OmitDBObject<T>>
	//archiving
	TTL?: number;
	lastUpdatedTTL?: number;
}

type TypeOf<ValueType> = ValueType extends any[] ? 'array' :
	ValueType extends object ? 'object' :
		ValueType extends string ? 'string' :
			ValueType extends number ? 'number' :
				ValueType extends boolean ? 'boolean' : never;

export type MetadataProperty<ValueType> = {
	valueType: TypeOf<ValueType>,
	// optional: ValueType extends undefined ? true: false,
	optional: boolean,
	description: string

}

// export type MetadataRootObject<T extends any> = { [K in keyof T]-?: MetadataNested<T[K]> };
export type MetadataObject<T extends any> = { [K in keyof T]-?: MetadataNested<T[K]> };
// export type MetadataArray<T extends any> = MetadataNested<T>;

export type MetadataNested<T extends any> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataProperty<T> & { metadata: MetadataObject<T> } :
			MetadataProperty<T>;

export type Metadata<T extends any> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataObject<T> :
			MetadataProperty<T>;

type ZEVEL = {
	ashpa: string
}
type PAH = {
	a: string
	b?: number
	c: string[]
	d: { k: string, l: number }
	e: ZEVEL
}

export const DB_Object_Metadata: Metadata<DB_Object> = {
	_id: {optional: false, valueType: 'string', description: 'unique key'},
	_v: {optional: false, valueType: 'string', description: 'version'},
	_originDocId: {optional: true, valueType: 'string', description: 'previous doc id'},
	__hardDelete: {optional: true, valueType: 'boolean', description: 'is hard delete'},
	__created: {optional: false, valueType: 'number', description: 'timestamp of creation'},
	__updated: {optional: false, valueType: 'number', description: 'timestamp of last time modified'}
};

//@ts-ignore
const pah: Metadata<PAH> = {
	a: {optional: false, description: 'aaa', valueType: 'string'},
	b: {optional: true, description: 'aaa', valueType: 'number'},
	c: {
		optional: true,
		description: 'harti barti',
		valueType: 'array',
		metadata: {optional: false, description: 'aaa', valueType: 'string'}
	},
	d: {
		optional: true,
		description: 'harti barti',
		valueType: 'object',
		metadata: {
			k: {optional: false, description: 'aaa', valueType: 'string'},
			l: {optional: false, description: 'aaa', valueType: 'number'}
		}
	},
	e: {
		optional: true,
		description: 'harti barti',
		valueType: 'object',
		metadata: {ashpa: {optional: false, description: 'aaa', valueType: 'string'}}
	}
};

// console.log(pah);