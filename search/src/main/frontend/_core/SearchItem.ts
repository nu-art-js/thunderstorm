import {DBProto, UniqueId} from '@nu-art/ts-common';
import {SearchAddOnDef} from './SearchAddOn';
import {ModuleFE_BaseDB} from '@nu-art/thunderstorm/frontend';

type AddOnTuple = readonly SearchAddOnDef<any, any, any, any>[]

type SearchAddOnsMethodExtractor<P extends DBProto<any>, A extends AddOnTuple> = {
	[M in A[number]['methodName']]:
	Extract<A[number], { methodName: M }> extends { itemParam: infer IP }
		? (pointer: { key: P['dbKey']; id: UniqueId }) => IP
		: never
};

type SearchAddOnsKeyExtractor<A extends AddOnTuple> = {
	readonly [K in keyof A]: A[K] extends { key: infer Key extends PropertyKey } ? Key : never
};

export type SearchItem<Proto extends DBProto<any>, A extends AddOnTuple> = {
	module: ModuleFE_BaseDB<Proto>;
	addOnMethods: SearchAddOnsMethodExtractor<Proto, A>;
	compatibleAddOnKeys: SearchAddOnsKeyExtractor<A>;
}