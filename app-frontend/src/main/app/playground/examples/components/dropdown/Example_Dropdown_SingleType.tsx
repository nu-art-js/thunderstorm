import * as React from 'react';
import {ICONS} from '@res/icons';
import {Adapter, BaseNodeRenderer, ComponentSync, LL_V_C, SimpleListAdapter, TS_Checkbox, TS_DropDown} from '@nu-art/thunderstorm/frontend';
import {Plague, plagues} from './consts';
import {Filter} from '@nu-art/ts-common';


type State = {
	selected?: Plague,
	autoComplete: boolean
	filter: boolean
};

class Example_Dropdown_SingleType
	extends ComponentSync<{}, State> {

	protected deriveStateFromProps(nextProps: {}): State {
		return {autoComplete: false, filter: true};
	}

	onSelected = (plague: Plague) => {
		this.setState({selected: plague});
	};

	render() {
		return <LL_V_C>
			<div className="ll_h_t" style={{marginBottom: 8}}>
				{this.renderConfigPanel()}
				{this.renderDropDown()}
			</div>
			<div className="ts-playground__results">{this.state?.selected ? `You chose: ${this.state.selected.value}` : 'You didn\'t choose yet'}</div>
		</LL_V_C>;
	}

	private renderDropDown() {
		const valueRenderer = (selected?: Plague) => {
			const style: React.CSSProperties = {boxSizing: 'border-box', height: '100%', width: '100%', padding: '4px 7px'};
			if (!selected)
				return;
			// return <div style={style}>CHOOSE</div>
			return <div style={{...style, color: 'red'}}>{selected.label}</div>;
		};

		const simpleAdapter: Adapter = SimpleListAdapter(plagues, (item) => <ItemRenderer {...item}/>);
		const caret = {
			open: this.caretItem(ICONS.arrowOpen(undefined)),
			close: this.caretItem(ICONS.arrowClose(undefined))
		};

		return <div className="ll_v_l" style={{marginLeft: 8}}>
			<TS_DropDown
				placeholder="Choose"
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				selectedItemRenderer={valueRenderer}
				filter={new Filter<Plague>((item: any) => ([item.label.toLowerCase()]))}
				caret={caret}
			/>
		</div>;
	}

	private renderConfigPanel() {
		return <div className="ll_v_l">
			<TS_Checkbox
				checked={this.state.autoComplete}
				onCheck={(autoComplete: boolean) => this.setState({autoComplete})}/>

			<TS_Checkbox
				checked={this.state.filter}
				onCheck={(filter: boolean) => this.setState({filter})}/>
		</div>;
	}

	private caretItem(icon: React.ReactNode) {
		return <div style={{paddingInlineStart: 4, paddingInlineEnd: 4}}>
			<div>{icon}</div>
		</div>;
	}
}

export class ItemRenderer
	extends BaseNodeRenderer<Plague> {

	renderItem(item: Plague) {
		return (
			<div className="ll_h_c clickable match_width">

				<div>
					<div className={`ll_h_c match_width`} style={{justifyContent: 'space-between'}}>
						<div>{item.label}</div>
						{/*{this.props.node.selected && <img src={require('@res/icons/icon__check.svg')} width={12}/>}*/}
					</div>
				</div>
			</div>
		);
	}
}

export const Playground_DropdownSingleType = {name: 'Dropdown - Single Type',renderer: Example_Dropdown_SingleType}