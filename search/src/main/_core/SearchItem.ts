import {CSSProperties, ReactNode} from 'react';
import {SearchAddOnDef, SearchResult} from './SearchAddOn.js';
import {ModuleFE_BaseDB} from '@nu-art/db-api-frontend';
import {DB_Prototype} from '@nu-art/db-api-shared';

type AddOnTuple = readonly SearchAddOnDef<any, any, any, any>[];

type SearchAddOnsMethodExtractor<A extends AddOnTuple> = {
	[M in A[number]['methodName']]: Extract<A[number], { methodName: M }> extends { itemValueType: infer IP }
		? (result: SearchResult) => IP
		: never;
};

type SearchAddOnsKeyExtractor<A extends AddOnTuple> = {
	readonly [K in keyof A]: A[K] extends { key: infer Key extends PropertyKey } ? Key : never;
};

export type SearchItem<Proto extends DB_Prototype, A extends AddOnTuple> = Readonly<{
	module: ModuleFE_BaseDB<Proto>;
	entityLabel: string;
	addOnMethods: Readonly<SearchAddOnsMethodExtractor<A>>;
	compatibleAddOnKeys: Readonly<SearchAddOnsKeyExtractor<A>>;
	resultRenderer: (result: SearchResult, style?: CSSProperties) => ReactNode;
	labelResolver: (result: SearchResult) => string;
}>;
