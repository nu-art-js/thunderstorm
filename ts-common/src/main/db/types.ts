import {DB_Object, DotNotation, DotNotationValueType, OmitDBObject, SubsetObjectByKeys, UniqueId} from '../utils/types';
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

export type ProtoDependencies<T extends object> = { [K in DotNotation<T>]?: DBProto<any> }

type Exact<T, Shape> = T & {
	[K in Exclude<keyof Shape, keyof T>]?: never;
};

/**
 * Defines the base structure and constraints for a database object.
 *
 * @template T The base type of the database object.
 * @template GeneratedKeys Keys that are auto-generated and should not be manually modified.
 * @template Versions Versioning information for the database object.
 * @template UniqueKeys Keys that are unique to each instance of the database object.
 * @template Dependencies (Future Use) Defines dependencies or relationships to other database objects.
 */
export type Proto_DB_Object<
	T extends DB_Object,
	DatabaseKey extends string,
	GeneratedKeys extends keyof T | never,
	Versions extends VersionsDeclaration<VersionType[]>,
	UniqueKeys extends keyof T = Default_UniqueKey,
	Dependencies extends Exact<{ [K in DotNotation<T>]?: DBProto<any> }, Dependencies> = never> = {

	type: T,
	dbKey: DatabaseKey;
	generatedKeys: GeneratedKeys | keyof DB_Object
	versions: Versions,
	uniqueKeys: UniqueKeys
	dependencies: keyof Dependencies extends never ? never : Dependencies
}

type DependenciesImpl<T extends object, D extends ProtoDependencies<T>> = {
	[K in keyof D]: D[K] extends DBProto<any>
		? {
			dbKey: D[K]['dbKey'],
			fieldType: TypeOfTypeAsString<DotNotationValueType<T, K & string>>
		}
		: never
}

/**
 * Extends Proto_DB_Object with additional UI and validation details.
 *
 * @template P The Proto_DB_Object this DBProto is based on.
 * @template ModifiableSubType The subset of P's type that is modifiable.
 * @template GeneratedSubType The subset of P's type that is auto-generated.
 */
export type DBProto<P extends Proto_DB_Object<any, string, any, VersionsDeclaration<VersionType[]>, any, any>, ModifiableSubType = Omit<P['type'], P['generatedKeys'] | keyof DB_Object>, GeneratedSubType = SubsetObjectByKeys<P['type'], P['generatedKeys']>> = {
	proto: P
	uiType: ModifiableSubType & Partial<GeneratedSubType> & Partial<DB_Object>,
	preDbType: ModifiableSubType & Partial<GeneratedSubType>,
	dbType: P['type'],
	dbKey: P['dbKey'],
	generatedPropsValidator: ValidatorTypeResolver<Omit<GeneratedSubType, keyof DB_Object>>
	modifiablePropsValidator: ValidatorTypeResolver<ModifiableSubType>
	uniqueKeys: P['uniqueKeys'][],
	generatedProps: P['generatedKeys'][]
	versions: P['versions']
	indices: DBIndex<P['type']>[]
	uniqueParam: UniqueId | { [K in P['uniqueKeys']]: P['type'][K] }
	metadata?: Metadata<OmitDBObject<P['type']>>
	lockKeys?: (keyof P['type'])[]
	dependencies: DependenciesImpl<P['type'], P['dependencies']>
}

/**
 * Represents the definition of a database entity with metadata and validation rules.
 *
 * @template Proto The DBProto type that this definition is based on.
 */
export type DBDef_V3<Proto extends DBProto<any, any, any>> = {
	dbKey: Proto['dbKey'];
	entityName: string;
	frontend: {
		name: string;
		group: string;
	};
	backend: {
		name: string;
	};
	TTL?: number;
	lastUpdatedTTL?: number;
	upgradeChunksSize?: number;
	generatedPropsValidator: Proto['generatedPropsValidator'];
	modifiablePropsValidator: Proto['modifiablePropsValidator'];
	uniqueKeys?: Proto['uniqueKeys'];
	versions: Proto['versions']['versions'];
	indices?: Proto['indices'];
	lockKeys?: Proto['lockKeys'];
	metadata?: Proto['metadata'];
	dependencies?: Proto['dependencies']
}

/**
 * @field version - First item in the array is current version, Must pass all past versions with the current, default version is 1.0.0
 */
export type DBDef<T extends DB_Object, Ks extends keyof T = Default_UniqueKey> = {
	validator: ValidatorTypeResolver<OmitDBObject<T>>;
	dbKey: string;
	dbGroup: string;
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
export type test = TypeOfTypeAsString<DotNotationValueType<{ a?: { b?: string } }, 'a.b'>>

export type TypeOfTypeAsString<ValueType> =
	ValueType extends any[] ?
		ValueType extends string[] ? 'string[]' :
			ValueType extends number[] ? 'number[]' :
				ValueType extends boolean[] ? 'boolean[]' :
					ValueType extends object[] ? 'object[]' : 'array'
		:
		ValueType extends string ? 'string' :
			ValueType extends number ? 'number' :
				ValueType extends boolean ? 'boolean' :
					ValueType extends object ? 'object' :
						never;

export type MetadataProperty<ValueType> = {
	valueType: TypeOfTypeAsString<ValueType>,
	optional: boolean,
	description: string

}

export type MetadataObject<T> = { [K in keyof T]-?: MetadataNested<T[K]> };

export type MetadataNested<T> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataProperty<T> & { metadata: MetadataObject<T> } :
			MetadataProperty<T>;

export type Metadata<T> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataObject<T> :
			MetadataProperty<T>;
