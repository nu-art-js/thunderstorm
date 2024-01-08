import {ComponentSync} from './ComponentSync';
import {TS_Object, ThisShouldNotHappenException, _keys, compare} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2, QueryParamKey} from '../modules/ModuleFE_BrowserHistoryV2';

export type ProtoComponentDef_QueryKeys<T extends ProtoComponentDef> = (keyof T['queryParams'])[];

export type ProtoComponent_State<Q> = {
	queryParams: Partial<Q>;
};

export type ProtoComponentDef<Q extends TS_Object = TS_Object, P extends {} = {}, S extends ProtoComponent_State<Q> = ProtoComponent_State<Q>> = {
	queryParams: Q
	props: P,
	state: S,
}

export abstract class ProtoComponent<T extends ProtoComponentDef>
	extends ComponentSync<T['props'], T['state']>
	implements OnUrlParamsChangedListenerV2 {

	abstract readonly queryParamArray: ProtoComponentDef_QueryKeys<T>;
	private readonly queryParamKeyMap: { [K in keyof T['queryParams']]: QueryParamKey<T['queryParams'][K]> } = {} as { [K in keyof T['queryParams']]: QueryParamKey<T['queryParams'][K]> };

	// ######################## Life Cycle ########################

	protected ComponentDidMount() {
		this.queryParamArray.forEach(param => {
			this.queryParamKeyMap[param] = new QueryParamKey(param as string);
		});
	}

	__onUrlParamsChangedV2 = () => {
		const queryParams = this.getQueryObject();
		if (!compare(queryParams, this.state.queryParams))
			this.reDeriveState({queryParams});
	};

	protected _deriveStateFromProps(nextProps: T['props'], state?: Partial<T['state']>): T['state'] | undefined {
		this.logVerbose('Deriving state from props');
		state ??= this.state ? {...this.state} : {queryParams: this.getQueryObject()};
		const _state = this.deriveStateFromProps(nextProps, state);
		this.mounted && _state && this.setState(_state);
		return _state;
	}

	private getQueryObject(): Partial<T['queryParams']> {
		const queryParams: Partial<T['queryParams']> = {};
		this.queryParamArray.forEach(key => {
			const queryKey = this.getQueryParamKeyForKey(key);
			queryParams[key] = queryKey.get();
		});
		return queryParams;
	}

	// ######################## Class Methods ########################

	private getQueryParamKeyForKey(key: keyof T['queryParams']) {
		const queryKey = this.queryParamKeyMap[key];
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