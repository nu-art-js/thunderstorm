import {DB_Object, OmitDBObject, SubsetKeys, SubsetObjectByKeys, UniqueId} from '../utils/types';
import {ValidatorTypeResolver} from '../validator/validator-core';


export type DBIndex<T extends DB_Object> = {
	id: string,
	keys: keyof T | (keyof T)[],
	params?: { multiEntry: boolean, unique: boolean }
};

export type Default_UniqueKey = '_id';
export type VersionType = string
export type VersionsDeclaration<Versions extends VersionType[] = ['1.0.0'], Types extends { [V in Versions[number]]: DB_Object } = { [V in Versions[number]]: DB_Object }> = {
	versions: Versions
	types: Types
};

export type InnerDependencies<T extends DB_Object, K extends SubsetKeys<keyof T, T, string | string[]>, Proto extends DBProto<any>> = {
	key: K
	proto: Proto
};

type Exact<T, Shape> = T & {
	[K in Exclude<keyof Shape, keyof T>]?: never;
};

export type Proto_DB_Object<
	T extends DB_Object,
	GeneratedKeys extends keyof T | never,
	Versions extends VersionsDeclaration<VersionType[]>,
	UniqueKeys extends keyof T = Default_UniqueKey,
	Dependencies extends Exact<{ [K in SubsetKeys<keyof T, T, string | string[]>]?: DBProto<any> }, Dependencies> = never> = {

	type: T,
	generatedKeys: GeneratedKeys | keyof DB_Object
	versions: Versions,
	uniqueKeys: UniqueKeys
	dependencies: Dependencies
}

export type DBProto<P extends Proto_DB_Object<any, any, VersionsDeclaration<VersionType[]>, any, any>, ModifiableSubType = Omit<P['type'], P['generatedKeys'] | keyof DB_Object>, GeneratedSubType = SubsetObjectByKeys<P['type'], P['generatedKeys']>> = {
	uiType: ModifiableSubType & Partial<GeneratedSubType> & Partial<DB_Object>,
	preDbType: ModifiableSubType & Partial<GeneratedSubType>,
	dbType: P['type'],
	generatedPropsValidator: ValidatorTypeResolver<Omit<GeneratedSubType, keyof DB_Object>>
	modifiablePropsValidator: ValidatorTypeResolver<ModifiableSubType>
	uniqueKeys: P['uniqueKeys'][],
	generatedProps: P['generatedKeys'][]
	versions: P['versions']
	indices: DBIndex<P['type']>[]
	uniqueParam: UniqueId | { [K in P['uniqueKeys']]: P['type'][K] }
	metadata?: Metadata<OmitDBObject<P['type']>>
	lockKeys?: (keyof P['type'])[]
}

export type DBDef_V3<P extends DBProto<any, any, any>> = {
	dbName: string;
	entityName: string;
	TTL?: number;
	lastUpdatedTTL?: number;
	upgradeChunksSize?: number;
	generatedPropsValidator: P['generatedPropsValidator'];
	modifiablePropsValidator: P['modifiablePropsValidator'];
	uniqueKeys?: P['uniqueKeys'];
	versions?: P['versions']['versions'];
	indices?: P['indices'];
	lockKeys?: P['lockKeys'];
	metadata?: P['metadata'];
}

/**
 * @field version - First item in the array is current version, Must pass all past versions with the current, default version is 1.0.0
 */
export type DBDef<T extends DB_Object, Ks extends keyof T = Default_UniqueKey> = {
	validator: ValidatorTypeResolver<OmitDBObject<T>>;
	dbName: string;
	entityName: string;
	lockKeys?: (keyof T)[] // fallback to uniqueKeys, default ["_id"]
	uniqueKeys?: Ks[] // default ["_id"]
	upgradeChunksSize?: number
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
	optional: boolean,
	description: string

}

export type MetadataObject<T extends any> = { [K in keyof T]-?: MetadataNested<T[K]> };

export type MetadataNested<T extends any> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataProperty<T> & { metadata: MetadataObject<T> } :
			MetadataProperty<T>;

export type Metadata<T extends any> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataObject<T> :
			MetadataProperty<T>;
