import * as React from "react";
import {ICONS} from "@res/icons";
import {
	Adapter,
	AdapterBuilder,
	BaseComponent,
	BaseNodeRenderer,
	CheckboxRenderer_DefaultCircle,
	DropDown_headerStyle,
	DropDown_inputStyle,
	TS_Checkbox,
	TS_DropDown
} from "@nu-art/thunderstorm/frontend";
import {optionRendererStyle, Plague, plagues} from "./consts";
import {PlaygroundExample_BodyStyle, PlaygroundExample_ResultStyle} from "../consts";
import {PG_Example} from "../_core/PG_Example";


type State = {
	selected?: Plague,
	autoComplete: boolean
	filter: boolean
};

class Example_Dropdown_SingleType
	extends BaseComponent<{}, State> {

	constructor(p: {}) {
		super(p);
		this.state = {
			autoComplete: false,
			filter: true
		}
	}

	onSelected = (plague: Plague) => {
		this.setState({selected: plague});
	};

	render() {
		return <div {...PlaygroundExample_BodyStyle}>
			<div className="ll_h_t" style={{marginBottom: 8}}>
				{this.renderConfigPanel()}
				{this.renderDropDown()}
			</div>
			<div {...PlaygroundExample_ResultStyle}>{this.state?.selected ? `You chose: ${this.state.selected.value}` : "You didn't choose yet"}</div>
		</div>
	}

	private renderDropDown() {
		const valueRenderer = (selected?: Plague) => {
			const style: React.CSSProperties = {boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (!selected)
				return
			// return <div style={style}>CHOOSE</div>
			return <div style={{...style, color: "red"}}>{selected.label}</div>;
		};

		const inputStylable = {
			// className: inputClassName,
			style: DropDown_inputStyle,
			placeholder: this.state.selected?.label
		};

		const simpleAdapter: Adapter = AdapterBuilder()
			.list()
			.singleRender(ItemRenderer)
			.setData(plagues)
			.build();

		const caret = {
			open: this.caretItem(ICONS.arrowOpen(undefined, 11)),
			close: this.caretItem(ICONS.arrowClose(undefined, 11))
		}

		return <div className="ll_v_l" style={{marginLeft: 8}}>
			<TS_DropDown
				placeholder="Choose"
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				selectedItemRenderer={valueRenderer}
				inputStylable={inputStylable}
				filterMapper={this.state.filter ? (item) => [item.label.toLowerCase()] : undefined}
				caret={caret}
				headerStylable={{style: DropDown_headerStyle}}
				autocomplete={this.state.autoComplete}
			/>
		</div>;
	}

	private renderConfigPanel() {
		return <div className="ll_v_l">
			<TS_Checkbox
				label={"Auto Complete"}
				checked={this.state.autoComplete}
				onCheck={(autoComplete: boolean) => this.setState({autoComplete})}/>

			<TS_Checkbox
				label={"With Filter"}
				checked={this.state.filter}
				renderer={CheckboxRenderer_DefaultCircle}
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
			<div className="ll_h_c clickable match_width"
					 id={this.props.node.path}
					 style={(this.props.node.focused || this.props.node.selected) ? {backgroundColor: "white"} : {}}>

				<div className={optionRendererStyle(this.props.node.selected)}>
					<div className={`ll_h_c match_width`} style={{justifyContent: "space-between"}}>
						<div style={this.props.node.focused ? {fontWeight: "bold"} : {}}>{item.label}</div>
						{this.props.node.selected && <img src={require('@res/icons/icon__check.svg')} width={12}/>}
					</div>
				</div>
			</div>
		);
	}
}

const name = "Dropdown - Single Type";

export function Playground_DropdownSingleType() {
	return {
		renderer: ()=><PG_Example name={name}> <Example_Dropdown_SingleType/> </PG_Example>,
		name
	};
}