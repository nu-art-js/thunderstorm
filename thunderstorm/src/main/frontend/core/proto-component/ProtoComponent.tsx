import {ComponentSync} from '../ComponentSync';
import {_keys, BadImplementationException, compare, RecursiveObjectOfPrimitives, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistoryV2, OnUrlParamsChangedListenerV2, QueryParamKey} from '../../modules/ModuleFE_BrowserHistoryV2';
import {ProtoComponentDef} from './types';


/**
 * @abstract
 * @class
 * Expansion on ComponentSync, this component takes a [ProtoComponentDef]{@link ProtoComponentDef} type that
 * defines its interaction with the URL hash. </br>
 * Constrained by the [ProtoComponentDef]{@link ProtoComponentDef}, the component will take an array of query param keys (string[]), and generate, provide functionality
 * and listen on changes in the URL hash. </br>
 * @augments ComponentSync
 * @implements OnUrlParamsChangedListenerV2
 * @copyright nu-art
 */
export abstract class ProtoComponent<Def extends ProtoComponentDef<any, any>, P extends {} = {}, S extends {} = {},
	Props extends Def['props'] & P = Def['props'] & P, State extends Def['state'] & S = Def['state'] & S>
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
	private getQueryParamObject() {
		const queryParams = {} as Def['queryParamKeys'];
		this.props.queryParamsKeys?.forEach(key => {
			queryParams[key] = this.getQueryParamKeyForKey(key);
		});
		return queryParams;
	}

	/**
	 * Returns a QueryParamKey class instance by a given key.</br>
	 * Will throw an error if the given key was not given in props.queryParamsKeys.</br>
	 * If state was not yet instantiated, will create a new QueryParamKey class instance and return it.
	 * If state was instantiated, will return the QueryParamKey class instance from the this.state.queryParams.
	 * @param key
	 * @private
	 */
	private getQueryParamKeyForKey(key: Def['queryParamKeys']) {
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
	}

	/**
	 * Generates an object connection each query param key given in the props to its current value as read from the URL
	 */
	private getQueryParamResultsObject() {
		const queryParamObject = this.getQueryParamObject();
		return _keys(queryParamObject).reduce((map, key) => {
			map[key] = queryParamObject[key].get();
			return map;
		}, {} as NonNullable<Def['state']['previousResultsObject']>);
	}

	// ######################## Singulars

	/**
	 * Will set a value in the URL hash for a given key.
	 * @param key
	 * @param value
	 */
	setQueryParam<K extends Def['queryParamKeys'] = Def['queryParamKeys']>(key: K, value: Def['queryParamDef'][K]) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.set(value);
	}

	/**
	 * Returns the value of a query param by given key
	 * @param key
	 */
	getQueryParam(key: Def['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		return queryKey.get();
	}

	/**
	 * Clears the value of a query param by a given key
	 * @param key
	 */
	deleteQueryParam(key: Def['queryParamKeys']) {
		const queryKey = this.getQueryParamKeyForKey(key);
		queryKey.delete();
	}

	// ######################## Multiples

	/**
	 * Will merge the given query object into the URL.
	 * @param query
	 */
	setQueryParams(query: Partial<Def['queryParamDef']>) {
		const currentState = ModuleFE_BrowserHistoryV2.getState();
		const merged = {...currentState, ...query};
		ModuleFE_BrowserHistoryV2.setState(merged as RecursiveObjectOfPrimitives);
	}
}