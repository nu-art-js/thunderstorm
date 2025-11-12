import {ReactNode} from 'react';
import {DBPointer, DBProto} from '@nu-art/ts-common';
import {SearchAddOnDef} from './SearchAddOn';
import {ModuleFE_BaseDB} from '@nu-art/thunderstorm/frontend';

type AddOnTuple = readonly SearchAddOnDef<any, any, any, any>[]

type SearchAddOnsMethodExtractor<A extends AddOnTuple> = {
	[M in A[number]['methodName']]:
	Extract<A[number], { methodName: M }> extends { itemParam: infer IP }
		? (pointer: DBPointer) => IP
		: never
};

type SearchAddOnsKeyExtractor<A extends AddOnTuple> = {
	readonly [K in keyof A]: A[K] extends { key: infer Key extends PropertyKey } ? Key : never
};

export type SearchItem<Proto extends DBProto<any>, A extends AddOnTuple> = Readonly<{
	module: ModuleFE_BaseDB<Proto>;
	addOnMethods: Readonly<SearchAddOnsMethodExtractor<A>>;
	compatibleAddOnKeys: Readonly<SearchAddOnsKeyExtractor<A>>;
	resultRenderer: (result: DBPointer) => ReactNode;
}>