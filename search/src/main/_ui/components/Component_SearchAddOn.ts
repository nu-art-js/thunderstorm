import {ComponentSync} from '@nu-art/thunder-widgets';
import {compare} from '@nu-art/ts-common';
import {SearchAddOn, SearchAddOnDef, SearchAddOnRenderer, SearchContext} from '../../_core/index.js';

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

	__onSearchFilterChanged() {
		const nextValue = this.props.context.filter.get(this.addOn.key);
		if (!compare(this.state.value, nextValue))
			this.setState({value: nextValue});
	}

	override componentDidMount() {
		this.props.context.filterChangeListeners.register(this);
		this.setState({value: this.props.context.filter.get(this.addOn.key)});
	}

	override componentWillUnmount() {
		this.props.context.filterChangeListeners.unregister(this);
	}

	protected setValue = (val?: AddOnDef['valueType']) => {
		this.props.context.filter.set(this.addOn.key, val);
	};
}
