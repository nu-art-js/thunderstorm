import {ComponentSync} from '../ComponentSync';
import {
	_keys,
	BadImplementationException,
	compare,
	ThisShouldNotHappenException
} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2, QueryParamKey} from '../../modules/ModuleFE_BrowserHistoryV2';
import {ProtoComponent_Props, ProtoComponent_QueryParamMapImpl, ProtoComponent_QueryParamResultsMap, ProtoComponent_State, ProtoComponentDef} from './types';

export abstract class ProtoComponent<T extends ProtoComponentDef<any, any>, P extends {} = {}, S extends {} = {},
	Props extends ProtoComponent_Props<T> & P = ProtoComponent_Props<T> & P, State extends ProtoComponent_State<T> & S = ProtoComponent_State<T> & S>
	extends ComponentSync<Props, State>
	implements OnUrlParamsChangedListenerV2 {

	// ######################## Life Cycle ########################

	__onUrlParamsChangedV2 = () => {
		const queryParams = this.getQueryParamResultsObject();
		if (!compare(queryParams, this.state?.previousResultsObject)) {
			this.reDeriveState({previousResultsObject: queryParams} as State);
		}
	};

	protected _deriveStateFromProps(nextProps: Props, state?: Partial<State>): State {
		this.logVerbose('Deriving state from props');
		state ??= this.state ? {...this.state} : {queryParams: this.getQueryParamObject()} as State;
		const _state = this.deriveStateFromProps(nextProps, state);
		this.mounted && _state && this.setState(_state);
		return _state;
	}

	// ######################## Class Methods ########################

	private getQueryParamObject(): ProtoComponent_QueryParamMapImpl<T> {
		const queryParams = {} as ProtoComponent_QueryParamMapImpl<T>;
		this.props.queryParamsKeys?.forEach(key => {
			queryParams[key] = this.getQueryParamKeyForKey(key);
		});
		return queryParams;
	}

	private getQueryParamResultsObject() {
		const queryParamObject = this.getQueryParamObject();
		return _keys(queryParamObject).reduce((map, key) => {
			map[key] = queryParamObject[key].get();
			return map;
		}, {} as ProtoComponent_QueryParamResultsMap<T>);
	}

	private getQueryParamKeyForKey(key: T['queryParamKeys']) {
		if (!this.props.queryParamsKeys?.includes(key))
			throw new BadImplementationException(`key ${key} is not defined in Props.queryParamsKeys, did you forget to add it?`);

		//State has not been established yet, pass a new QueryParamKey
		if (!this.state)
			return new QueryParamKey(key);

		//State has been established
		const queryKey = this.state.queryParams[key];
		if (!queryKey)
			throw new ThisShouldNotHappenException(`QueryParamKey for key ${key as string} not in state`);

		return queryKey;
	};

	// ######################## Singulars

	setQueryParam<K extends T['queryParamKeys'] = T['queryParamKeys']>(key: K, value: T['queryParamDef'][K]) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.set(value);
	}

	getQueryParam(key: T['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		return queryKey.get();
	}

	deleteQueryParam(key: T['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.delete();
	}

	// ######################## Multiples

	setQueryParams(query: Partial<T['queryParamDef']>) {
		ModuleFE_BrowserHistoryV2.replace(query);
		//No need to setState or re-derive since the listener should catch the change and trigger a re-derive.
	}
}