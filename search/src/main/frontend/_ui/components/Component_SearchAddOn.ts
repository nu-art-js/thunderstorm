import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import {compare} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef} from '../../_core';
import {SearchAddOnRenderer, SearchContext} from '../../_core/SearchContext';

type Props = {
	context: SearchContext;
};

type State<AddOnDef extends SearchAddOnDef<string, any, any, any>> = {
	value?: AddOnDef['valueType'];
};

export abstract class Component_SearchAddOn<
	AddOnDef extends SearchAddOnDef<string, any, any, any>,
	_Props extends {} = {},
	_State extends {} = {},
	P extends _Props & Props = _Props & Props,
	S extends _State & State<AddOnDef> = _State & State<AddOnDef>
>
	extends ComponentSync<P, S>
	implements SearchAddOnRenderer {

	public abstract readonly addOn: SearchAddOn<AddOnDef>;

	//######################### Life Cycle #########################

	__onSearchFilterChanged() {
		const nextValue = this.props.context.filter.get(this.addOn.key);
		if (!compare(this.state.value, nextValue))
			this.setState({value: nextValue});
	}

	componentDidMount() {
		this.props.context.filterChangeListeners.register(this);
	}

	componentWillUnmount() {
		this.props.context.filterChangeListeners.unregister(this);
	}

	//######################### Logic #########################

	protected setValue = (val?: AddOnDef['valueType']) => {
		this.props.context.filter.set(this.addOn.key, val);
	};
}