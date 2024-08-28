import {Primitive, RecursiveArrayOfPrimitives, RecursiveObjectOfPrimitives, SubsetObjectByKeys} from '@thunder-storm/common';


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
	queryParamDef: SubsetObjectByKeys<ParamTypes, ParamKeys>
	props: {
		keys: ParamKeys[]
	}
	state: {
		previousResultsObject?: { [Key in ParamKeys]: ParamTypes[Key] };
	}
}

export type SubProto<Def extends ProtoComponentDef<any, any>, Keys extends Def['queryParamKeys']> = ProtoComponentDef<Keys, Def['queryParamDef']>

export type SuperProto<Def1 extends ProtoComponentDef<any, any>, Def2 extends ProtoComponentDef<any, any>> = ProtoComponentDef<Def1['queryParamKeys'] | Def2['queryParamKeys'], Def1['queryParamDef'] & Def2['queryParamDef']>

// export type Test1 = ProtoComponentDef<'pah' | 'ashpa', { pah: string, zevel: string, ashpa: string }>
// export type Test2 = SubProto<Test1, 'ashpa'>
// export type Test3 = SubProto<Test1, 'pah'>
// export type Test4 = SuperProto<Test2, Test3>
// const t: Test4 = {
// 	queryParamDef: {
// 		'pah': 'qd',
// 		'ashpa': 'asd',
// 		'zevel': 'asdas'
// 	},
// 	props: {
// 		queryParamsKeys: ['pah', 'ashpa']
// 	}
// };
