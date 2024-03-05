import {Primitive, RecursiveArrayOfPrimitives, RecursiveObjectOfPrimitives, SubsetObjectByKeys} from '@nu-art/ts-common';
import {QueryParamKey} from '../../modules/ModuleFE_BrowserHistoryV2';


/**
 * A Definition type for the [ProtoComponent]{@link ProtoComponent}, this type takes 2 arguments:</br>
 * QPK - a list of URL param keys this def will deal with</br>
 * QPD - an object describing the value types for the keys in QPK, no different from a React state definition.
 */
export type ProtoComponentDef<
	ParamKeys extends string,
	ParamTypes extends { [K in ParamKeys]: Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives },
> = {
	queryParamKeys: ParamKeys;
	queryParamDef: ParamTypes
	props: {
		queryParamsKeys?: ParamKeys[]
	}
	state: {
		queryParams: { [Key in ParamKeys]: QueryParamKey<ParamTypes[Key]> };
		previousResultsObject?: { [Key in ParamKeys]: ParamTypes[Key] };
	}
}

export type SubProto<Def extends ProtoComponentDef<any, any>, Keys extends Def['queryParamKeys']> = ProtoComponentDef<Keys, SubsetObjectByKeys<Def['queryParamDef'], Keys>>
