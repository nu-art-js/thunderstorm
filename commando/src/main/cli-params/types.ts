import {Primitive, TypeOfTypeAsString} from '@nu-art/ts-common';


export type CliParams<T extends BaseCliParam<string, any>[]> = {
	[K in T[number]['keyName']]: NonNullable<Extract<T[number], { keyName: K }>['defaultValue']>
}

export type DependencyParam<T extends Primitive | Primitive[]> = {
	param: BaseCliParam<string, T>, value: T
}

export type BaseCliParam<K extends string, V extends Primitive | Primitive[]> = {
	keys: string[];
	keyName: K;
	type: TypeOfTypeAsString<V>;
	description: string;
	name?: string;
	options?: string[];
	defaultValue?: V;
	process?: (value?: string, defaultValue?: V) => V;
	isArray?: true;
	group?: string;
	dependencies?: DependencyParam<any>[]
}

export type CliParam<K extends string, V extends Primitive | Primitive[]> = BaseCliParam<K, V> & {
	name: string;
	process: (value?: string, defaultValue?: V) => V;
}