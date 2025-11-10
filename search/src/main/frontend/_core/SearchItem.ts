import {DBProto, UniqueId} from '@nu-art/ts-common';
import {SearchAddOnDef} from './SearchAddOn';
import {ModuleFE_BaseDB} from '@nu-art/thunderstorm/frontend';

type SearchAddOnsMethodExtractor<P extends DBProto<any>, A extends SearchAddOnDef<any, any, any, any>> = {
	[MethodName in A['methodName']]: (pointer: { key: P['dbKey'], id: UniqueId }) => A['itemParam'];
}

export type SearchItem<Proto extends DBProto<any>, AddOns extends SearchAddOnDef<any, any, any, any>> = {
	module: ModuleFE_BaseDB<Proto>;
	addOnMethods: SearchAddOnsMethodExtractor<Proto, AddOns>;
}