import {DB_Object} from '@nu-art/ts-common';

type TypeOf<ValueType> = ValueType extends string ? 'string' :
	ValueType extends number ? 'number' :
		ValueType extends boolean ? 'boolean' : never;

export type MetadataProperty<ValueType> = {
	valueType: TypeOf<ValueType>,
	// optional: ValueType extends undefined ? true: false,
	optional: boolean,
	description: string
}


export type MetadataObject<T extends any> = { [K in keyof T]-?: Metadata<T[K]> };
export type MetadataArray<T extends any> = Metadata<T>;
export type Metadata<T extends any> =
	T extends object ? MetadataObject<T> :
		T extends (infer I)[] ? [MetadataArray<I>] :
			MetadataProperty<T>;


type PAH = {
	a: string
	b?: number
	// c: string[]
	// d: { k: string, l: number }
}

export const DB_Object_Metadata:Metadata<DB_Object> = {
	_id: {optional: false, valueType: 'string', description: 'unique key'},
	_v: {optional: false, valueType: 'string', description: 'version'},
	__created: {optional: false, valueType: 'number', description: 'timestamp of creation'},
	__updated: {optional: false, valueType: 'number', description: 'timestamp of last time modified'}
};

const pah: Metadata<PAH> = {
	a: {optional: false, description: 'aaa', valueType: 'string'},
	b: {optional: true, description: 'aaa', valueType: 'number'},

};

console.log(pah);