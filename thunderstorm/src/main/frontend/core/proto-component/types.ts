import {Primitive, RecursiveArrayOfPrimitives, RecursiveObjectOfPrimitives} from '@nu-art/ts-common';
import {QueryParamKey} from '../../modules/ModuleFE_BrowserHistoryV2';

/**
 * Definition of the QueryParamMap, an object connecting key to the type of data it holds
 */
export type ProtoComponent_QueryParamMapDef<Keys extends string> = { [K in Keys]: Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives };

/**
 * Implementation of the QueryParamMap, an object connection key to the QueryParamKey class that manages its data
 */
export type ProtoComponent_QueryParamMapImpl<T extends ProtoComponentDef<any, any>> = { [K in T['queryParamKeys']]: QueryParamKey<T['queryParamDef'][K]> };

/**
 * An object connecting key to its data
 */
export type ProtoComponent_QueryParamResultsMap<T extends ProtoComponentDef<any, any>> = { [K in T['queryParamKeys']]: T['queryParamDef'][K] }


export type ProtoComponent_Props<T extends ProtoComponentDef<any, any>> = {
	queryParamsKeys?: T['queryParamKeys'][];
}

export type ProtoComponent_State<T extends ProtoComponentDef<any, any>> = {
	queryParams: ProtoComponent_QueryParamMapImpl<T>;
	previousResultsObject?: ProtoComponent_QueryParamResultsMap<T>;
};

export type ProtoComponentDef<QPK extends string, QPD extends ProtoComponent_QueryParamMapDef<QPK>> = {
	queryParamKeys: QPK;
	queryParamDef: QPD
}