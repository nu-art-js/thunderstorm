import {Adapter} from "@nu-art/thunderstorm/app-frontend/components/tree/Adapter";
import {
	DropDown,
	headerStyle,
	HeaderStyleProps,
	InputProps,
	inputStyle,
	ValueProps
} from "@nu-art/thunderstorm/app-frontend/components/DropDown";
import * as React from "react";
import {
	customInputStyle,
	ItemRenderer,
	Plague,
	plagues
} from "./Example_DropDowns";
import {css} from "emotion";
import {ICONS} from "@res/icons";

export class Example_SingleRendererDropDown
	extends React.Component<{}, { _selected: string }> {

	state = {_selected: ''};

	onSelected = (plague: Plague) => {
		this.setState({_selected: plague.value});
	};

	render() {
		const valueRenderer = (props: ValueProps<Plague>) => {
			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
			if (props.selected)
				return <div style={{...style, color: "red"}}>{props.selected.label}</div>;
			return <div style={style}>{props.placeholder}</div>
		};
		const inputResolver = (selected?: Plague): InputProps => (
			{
				className: customInputStyle(!!selected),
				inputStyle,
				placeholder: this.state._selected
			}
		);
		const headerResolverClass: HeaderStyleProps = {headerStyle, headerClassName: css({boxShadow: "5px 10px #888888"})};
		const simpleAdapter = new Adapter<Plague>().setData(plagues).setTreeNodeRenderer(ItemRenderer);
		simpleAdapter.hideRoot = true;
		return <div>
			<h4>Filter, carets, placeholder & all renderers</h4>
			<h4>single renderer</h4>
			<DropDown
				adapter={simpleAdapter}
				onSelected={this.onSelected}
				valueRenderer={valueRenderer}
				inputResolver={inputResolver}
				filter={(item) => [(item as Plague).label.toLowerCase()]}
				mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowOpen(undefined, 14)}</div>}
				closeCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowClose(undefined, 14)}</div>}
				placeholder={"Choose a plague"}
				headerStyleResolver={headerResolverClass}
			/>
		</div>
	}
}