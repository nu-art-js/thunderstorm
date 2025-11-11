import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import {SearchAddOnRenderer, SearchContext} from './SearchContext';
import {SearchAddOn, SearchAddOnDef} from './SearchAddOn';
import {compare} from '@nu-art/ts-common';

type Props<AddOnDef extends SearchAddOnDef<string, any, any, any>> = {
	context: SearchContext;
	addOn: SearchAddOn<AddOnDef>;
};

type State<AddOnDef extends SearchAddOnDef<string, any, any, any>> = {
	value?: AddOnDef['param'];
};

export class Component_SearchAddOn<AddOnDef extends SearchAddOnDef<string, any, any, any>>
	extends ComponentSync<Props<AddOnDef>, State<AddOnDef>>
	implements SearchAddOnRenderer {

	__onSearchFilterChanged = () => {
		const nextValue = this.props.context.filter.get(this.props.addOn.key);
		if (!compare(this.state.value, nextValue))
			this.setState({value: nextValue});
	};

	componentDidMount() {
		this.props.context.addOn.register(this.props.addOn);
		this.props.context.filterChangeListeners.register(this);
	}

	componentWillUnmount() {
		this.props.context.addOn.unregister(this.props.addOn);
		this.props.context.filterChangeListeners.unregister(this);
	}
}