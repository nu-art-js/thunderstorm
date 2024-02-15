import {ComponentSync} from './ComponentSync';
import {TS_Object, ThisShouldNotHappenException, _keys, compare, RecursiveObjectOfPrimitives, RecursiveArrayOfPrimitives, Primitive} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2, QueryParamKey} from '../modules/ModuleFE_BrowserHistoryV2';

type QueryParamMapDef<O extends TS_Object, E extends string = never> = { [K in (keyof O | E)]: Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives }
type QueryParamMapImpl<T extends ProtoComponentDef> = { [K in keyof T['queryParams']]: QueryParamKey<T['queryParams'][K]> }

type ProtoComponent_Props<O extends TS_Object, E extends string = never> = {
	queryParamsKeys?: (keyof O | E)[];
}

type ProtoComponent_State<O extends TS_Object, E extends string = never, Q extends QueryParamMapDef<O, E> = QueryParamMapDef<O, E>> = {
	queryParams: QueryParamMapImpl<any>
};

export type ProtoComponentDef<
	O extends TS_Object = TS_Object, //The object we are looking at
	P extends {} = {}, //Extra props given from above
	S extends {} = {}, //Extra state given from above
	E extends string = string, //Extra keys other than the keys of the object
	Q extends QueryParamMapDef<O, E> = QueryParamMapDef<O, E>, //A query map defining the data for each key
	Props = ProtoComponent_Props<O, E> & P,
	State = ProtoComponent_State<O, E, Q> & S,
> = {
	queryParams: Q;
	props: Props,
	state: State,
}

export abstract class ProtoComponent<T extends ProtoComponentDef>
	extends ComponentSync<T['props'], T['state']>
	implements OnUrlParamsChangedListenerV2 {

	// ######################## Life Cycle ########################

	__onUrlParamsChangedV2 = () => {
		const queryParams = this.getQueryParamObject();
		if (!compare(queryParams, this.state.queryParams))
			this.reDeriveState({queryParams});
	};

	protected _deriveStateFromProps(nextProps: T['props'], state?: Partial<T['state']>): T['state'] | undefined {
		this.logVerbose('Deriving state from props');
		state ??= this.state ? {...this.state} : {queryParams: this.getInitialQueryObject()};
		const _state = this.deriveStateFromProps(nextProps, state);
		this.mounted && _state && this.setState(_state);
		return _state;
	}

	private getInitialQueryObject(): QueryParamMapImpl<T> {
		const queryParams = {} as QueryParamMapImpl<T>;
		this.props.queryParamsKeys?.forEach(key => {
			// @ts-ignore
			queryParams[key] = new QueryParamKey(key);
		});
		return queryParams;
	}

	// ######################## Class Methods ########################

	private getQueryParamObject(): QueryParamMapImpl<T> {
		const queryParams = {} as QueryParamMapImpl<T>;
		this.props.queryParamsKeys?.forEach(key => {
			// @ts-ignore
			queryParams[key] = this.getQueryParamKeyForKey(key);
		});
		return queryParams;
	}

	private getQueryParamKeyForKey(key: keyof T['queryParams']) {
		const queryKey = this.state.queryParams[key];
		if (!queryKey)
			throw new ThisShouldNotHappenException(`Could not get QueryParamKey for param ${key as string}`);
		return queryKey;
	};

	// ######################## Singulars

	setQueryParam = <K extends keyof T['queryParams'] = keyof T['queryParams']>(key: K, value: T['queryParams'][K]) => {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.set(value);
	};

	getQueryParam = (key: keyof T['queryParams']) => {
		const queryKey = this.getQueryParamKeyForKey(key);
		return queryKey.get();
	};

	deleteQueryParam = (key: keyof T['queryParams']) => {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.delete();
	};

	// ######################## Multiples

	setQueryParams = (query: Partial<T['queryParams']>) => {
		ModuleFE_BrowserHistoryV2.replace(query);
		//No need to setState or re-derive since the listener should catch the change and trigger a re-derive.
	};
}

// type SelectedState = {
// 	selected: {
// 		type: string;
// 		id: string;
// 	}[];
// }
//
// // type HCS_State2 = {
// // 	tag_filter: string,
// // 	tag_selectedId: string,
// // 	tag_selectedType: string;
// // 	var_filter: string,
// // 	var_selectedId: string,
// // 	value_filter: string;
// // 	value_tabKey: string;
// // }
//
// type HCS_State = SelectedState & {
// 	tagPanel: {
// 		filter: string,
// 	},
// 	variablePanel: {
// 		filter: string,
// 	},
// 	valuePanel: {
// 		filter: string;
// 		tabKey: string;
// 	}
// }
//
// type QPKDef_Tags = Pick<HCS_State, 'selected' | 'tagPanel'>;
//
// type QPKDef_Vars = Pick<HCS_State, 'selected' | 'variablePanel'>;
//
// type QPKDef_Values = Pick<HCS_State, 'selected' | 'valuePanel'>;
//
// const QPK_Tags = new QueryParamKey<QPKDef_Tags>('hcs');
//
// const QPK_Vars = new QueryParamKey<QPKDef_Vars>('hcs');
//
// const QPK_Values = new QueryParamKey<QPKDef_Values>('hcs');
//
//
// //EXPRESSION ################
//
// type ExpressionBuilder = SelectedState & {
// 	selectedTab: string;
// }
//
// type Expression_State = SelectedState & {
// 	selectedTab: string;
// 	filter: string;
// };
//
// type Pathway_State = SelectedState & {
// 	filter: string;
// }
//
// type QPKDef_ExpressionBuilder = ExpressionBuilder;
//
// const State = {
// 	searchV2: {
// 		filter: 'asd',
// 		group: 'pathway',
// 	},
// 	selected: [
// 		{type: 'pathway', id: '000'},
// 		{type: 'pathwayTransition', id: '111'},
// 		{type: 'expression', id: '123'},
// 	],
// 	expressionManager: {
// 		selectedTab: 'tab',
// 	},
// 	pathwayManager: {
// 		'...': '...',
// 	}
// };