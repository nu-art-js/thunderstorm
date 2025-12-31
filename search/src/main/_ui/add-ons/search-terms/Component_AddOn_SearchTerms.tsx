import {LL_H_C, TS_Input} from '@nu-art/thunder-routing';
import {SearchAddOn} from '../../../_core/index.js';
import {Component_SearchAddOn} from '../../components/Component_SearchAddOn.js';
import {AddOn_SearchTerms, AddOnDef_SearchTerms} from './types.js';
import './Component_AddOn_SearchTerms.scss';
import {TS_Icons} from '@nu-art/ts-styles';
import {InferProps, InferState} from '@nu-art/thunder-routing';

type Props = {
	placeholder?: string;
};

type State = {
	placeholder?: string;
};

export class Component_AddOn_SearchTerms
	extends Component_SearchAddOn<AddOnDef_SearchTerms, Props, State> {

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state.placeholder = nextProps.placeholder;
		return state;
	}

	public addOn: SearchAddOn<AddOnDef_SearchTerms> = AddOn_SearchTerms;

	render() {
		return <LL_H_C className={'search-add-on__search-terms'}>
			<TS_Input
				type={'text'}
				value={this.state.value}
				placeholder={this.state.placeholder}
				onChange={val => this.setValue(val.trimStart())}
			/>
			<TS_Icons.Search.component/>
		</LL_H_C>;
	}
}