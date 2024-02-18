import {ComponentSync} from '../ComponentSync';
import {
	_keys,
	BadImplementationException,
	compare, RecursiveObjectOfPrimitives,
	ThisShouldNotHappenException
} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2, QueryParamKey} from '../../modules/ModuleFE_BrowserHistoryV2';
import {ProtoComponent_Props, ProtoComponent_QueryParamMapImpl, ProtoComponent_QueryParamResultsMap, ProtoComponent_State, ProtoComponentDef} from './types';

export abstract class ProtoComponent<T extends ProtoComponentDef<any, any>, P extends {} = {}, S extends {} = {},
	Props extends ProtoComponent_Props<T> & P = ProtoComponent_Props<T> & P, State extends ProtoComponent_State<T> & S = ProtoComponent_State<T> & S>
	extends ComponentSync<Props, State>
	implements OnUrlParamsChangedListenerV2 {

	// ######################## Life Cycle ########################

	/**
	 * Listener for URL changes triggered by ModuleFE_BrowserHistoryV2.
	 * Will trigger deriveStateFromProps with the new state of the query params set to be the previous state,
	 * if there were changes in the hash that are relevant to this component.
	 */
	__onUrlParamsChangedV2 = () => {
		const queryParams = this.getQueryParamResultsObject();
		if (!compare(queryParams, this.state?.previousResultsObject)) {
			this.reDeriveState({previousResultsObject: queryParams} as State);
		}
	};

	protected _deriveStateFromProps(nextProps: Props, state?: Partial<State>): State {
		this.logVerbose('Deriving state from props');
		//Initial state set to be the query param object generated from the query params keys given in props.
		state ??= this.state ? {...this.state} : {queryParams: this.getQueryParamObject()} as State;
		const _state = this.deriveStateFromProps(nextProps, state);
		this.mounted && _state && this.setState(_state);
		return _state;
	}

	// ######################## Class Methods ########################

	/**
	 * Generates an object connecting each query param key given in the props to a QueryParamKey class instance.
	 * @private
	 */
	private getQueryParamObject(): ProtoComponent_QueryParamMapImpl<T> {
		const queryParams = {} as ProtoComponent_QueryParamMapImpl<T>;
		this.props.queryParamsKeys?.forEach(key => {
			queryParams[key] = this.getQueryParamKeyForKey(key);
		});
		return queryParams;
	}

	/**
	 * Generates an object connection each query param key given in the props to its current value as read from the URL
	 * @private
	 */
	private getQueryParamResultsObject() {
		const queryParamObject = this.getQueryParamObject();
		return _keys(queryParamObject).reduce((map, key) => {
			map[key] = queryParamObject[key].get();
			return map;
		}, {} as ProtoComponent_QueryParamResultsMap<T>);
	}

	/**
	 * Returns a QueryParamKey class instance by a given key.</br>
	 * Will throw an error if the given key was not given in props.queryParamsKeys.</br>
	 * If state was not yet instantiated, will create a new QueryParamKey class instance and return it.
	 * If state was instantiated, will return the QueryParamKey class instance from the this.state.queryParams.
	 * @param key
	 * @private
	 */
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

	/**
	 * Will set a value in the URL hash for a given key.
	 * @param key
	 * @param value
	 */
	setQueryParam<K extends T['queryParamKeys'] = T['queryParamKeys']>(key: K, value: T['queryParamDef'][K]) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.set(value);
	}

	/**
	 * Returns the value of a query param by given key
	 * @param key
	 */
	getQueryParam(key: T['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		return queryKey.get();
	}

	/**
	 * Clears the value of a query param by a given key
	 * @param key
	 */
	deleteQueryParam(key: T['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.delete();
	}

	// ######################## Multiples

	/**
	 * Will merge the given query object into the URL.
	 * @param query
	 */
	setQueryParams(query: Partial<T['queryParamDef']>) {
		const currentState = ModuleFE_BrowserHistoryV2.getState();
		const merged = {...currentState, ...query};
		ModuleFE_BrowserHistoryV2.setState(merged as RecursiveObjectOfPrimitives);
	}
}