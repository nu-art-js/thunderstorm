import * as React from "react";
import {ReactNode} from "react";
import {
	optionRendererStyle,
} from "./Example_DropDowns";
import {css} from "emotion";
import {ICONS} from "@res/icons";
import {
	Adapter,
	AdapterBuilder,
	BaseNodeRenderer,
	DropDown,
	headerStyle,
	inputStyle,
	Stylable
} from "@nu-art/thunderstorm/frontend";
import {inputClassName} from "./OstudioEx";
import { Plague, plagues } from "./consts";

export class Example_SingleRendererDropDown
	extends React.Component<{}, { _selected?: Plague }> {

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague});
	};

	render() {
		const valueRenderer = (selected?: Plague) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (!selected)
				return <div style={style}>CHOOSE</div>
			return <div style={{...style, color: "red"}}>{selected.label}</div>;
		};

		const inputStylable = {
			className: inputClassName,
			style: inputStyle,
			placeholder: this.state?._selected?.label
		};
		const headerResolverClass: Stylable = {style: headerStyle, className: css({boxShadow: "5px 10px #888888"})};
		const simpleAdapter: Adapter = AdapterBuilder()
			.list()
			.singleRender(ItemRenderer)
			.setData(plagues)
			.build();

		const caret = {
			open: this.caretItem(ICONS.arrowOpen(undefined, 11)),
			close: this.caretItem(ICONS.arrowClose(undefined, 11))
		}

		return <div>
			<h4>Filter, carets, placeholder & all renderers</h4>
			<h4>single renderer, flat list</h4>
			<DropDown
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				selectedItemRenderer={valueRenderer}
				inputStylable={inputStylable}
				filter={(item) => [item.label.toLowerCase()]}
				caret={caret}
				headerStylable={headerResolverClass}
				autocomplete={true}
			/>
			<h4>{this.state?._selected ? `You chose ${this.state._selected.value}` : "You didn't choose yet"}</h4>
		</div>
	}

	private caretItem(icon: ReactNode) {
		return <div style={{backgroundColor: "lime", paddingRight: 8}}>
			<div style={{marginTop: 3}}>{icon}</div>
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