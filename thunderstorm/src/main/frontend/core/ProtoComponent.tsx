import {ComponentSync} from './ComponentSync';
import {TS_Object, _keys} from '@nu-art/ts-common';

export type ProtoComponentDef_QueryKeys<T extends ProtoComponentDef> = (keyof T['queryParams'])[];

export type ProtoComponent_State<T extends ProtoComponentDef['queryParams']> = {
	queryParams: Partial<T>;
};

export type ProtoComponentDef<Q extends TS_Object = TS_Object, P extends {} = {}, S extends ProtoComponent_State<Q> = ProtoComponent_State<Q>> = {
	queryParams: Q
	props: P,
	state: S,
}

//FIXME: have this class listen to dispatch by BrowserV2 when the url changes

export abstract class ProtoComponent<T extends ProtoComponentDef>
	extends ComponentSync<T['props'], T['state']> {

	abstract readonly queryParams: ProtoComponentDef_QueryKeys<T>;

	__onQueryUpdated = () => {
		// FIXME: use when BrowserV2 can return query
		// const query = ModuleFE_BrowserHistoryV2.getQuery();
		const query = {};
		if (this.queryParams.some(param => {
			// @ts-ignore
			this.state.queryParams[param] !== query[param];
		}))
			this.reDeriveState();
	};

	protected deriveStateFromProps(nextProps: T['props'], state: T['state']): T['state'] {
		state = super.deriveStateFromProps(nextProps, state);
		// FIXME: use when BrowserV2 can return query
		// const query = ModuleFE_BrowserHistoryV2.getQuery();
		const query = {};

		this.queryParams.forEach(param => {
			// @ts-ignore - no idea why this doesn't work?
			state.queryParams[param] = query[param];
		});

		return state;
	}

	// ######################## Class Methods ########################

	setQueryParams = <K extends keyof T['queryParams'] = keyof T['queryParams']>(query: Partial<T['queryParams']>) => {
		//Call BrowserV2 to set the queryParam.
		//No need to setState or re-derive since the listener should catch the change and trigger a re-derive.
	};
}

type TestDef = ProtoComponentDef<{ a: number, b: string }>;

export class Test
	extends ProtoComponent<TestDef> {

	queryParams: ProtoComponentDef_QueryKeys<TestDef> = ['a', 'b'];

	public test = () => {
		this.setQueryParams({
			a: 1,
			b: '1',
		});
	};
}
