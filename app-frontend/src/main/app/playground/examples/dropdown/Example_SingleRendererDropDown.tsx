// import * as React from "react";
// import {
// 	customInputStyle,
// 	optionRendererStyle,
// 	Plague,
// 	plagues
// } from "./Example_DropDowns";
// import {css} from "emotion";
// import {ICONS} from "@res/icons";
// import {
// 	HeaderStyleProps,
// 	InputProps,
// 	inputStyle,
// 	ValueProps,
// 	Adapter,
// 	AdapterBuilder,
// 	headerStyle,
// 	DropDown,
// 	BaseNodeRenderer
// } from "@nu-art/thunderstorm/frontend";
//
// export class Example_SingleRendererDropDown
// 	extends React.Component<{}, { _selected: string }> {
//
// 	state = {_selected: ''};
//
// 	onSelected = (plague: Plague) => {
// 		this.setState({_selected: plague.value});
// 	};
//
// 	render() {
// 		const valueRenderer = (props: ValueProps<Plague>) => {
// 			const style: React.CSSProperties = {backgroundColor: "lime", boxSizing: "border-box", height: "100%", width: "100%", padding: "4px 7px"};
// 			if (props.selected)
// 				return <div style={{...style, color: "red"}}>{props.selected.label}</div>;
// 			return <div style={style}>{props.placeholder}</div>
// 		};
// 		const inputResolver = (selected?: Plague): InputProps => (
// 			{
// 				className: customInputStyle(!!selected),
// 				inputStyle,
// 				placeholder: this.state._selected
// 			}
// 		);
// 		const headerResolverClass: HeaderStyleProps = {headerStyle, headerClassName: css({boxShadow: "5px 10px #888888"})};
// 		// const simpleAdapter = new Adapter(plagues).setTreeNodeRenderer(ItemRenderer);
// 		const simpleAdapter: Adapter = AdapterBuilder()
// 			.list()
// 			.singleRender(ItemRenderer)
// 			.setData(plagues)
// 			.build();
// 		// simpleAdapter.hideRoot = true;
// 		return <div>
// 			<h4>Filter, carets, placeholder & all renderers</h4>
// 			<h4>single renderer</h4>
// 			<DropDown
// 				adapter={simpleAdapter}
// 				onSelected={this.onSelected}
// 				valueRenderer={valueRenderer}
// 				inputResolver={inputResolver}
// 				filter={(item) => [(item as Plague).label.toLowerCase()]}
// 				mainCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowOpen(undefined, 14)}</div>}
// 				closeCaret={<div style={{backgroundColor: "lime", paddingRight: 8}}>{ICONS.arrowClose(undefined, 14)}</div>}
// 				placeholder={"Choose a plague"}
// 				headerStyleResolver={headerResolverClass}
// 			/>
// 		</div>
// 	}
// }
//
// export class ItemRenderer
// 	extends BaseNodeRenderer<Plague> {
//
// 	renderItem(item: Plague) {
// 		return (
// 			<div className="ll_h_c clickable"
// 			     id={this.props.node.path}
// 			     onClick={(event: React.MouseEvent) => this.props.node.onClick(event)}
// 			     style={this.props.node.focused ? {backgroundColor: "white"} : {}}>
//
// 				<div className={optionRendererStyle(this.props.node.focused)}>
// 					<div className={`ll_h_c`} style={{justifyContent: "space-between"}}>
// 						<div>{item.label}</div>
// 						{this.props.node.focused && <div>{ICONS.check(undefined, 14)}</div>}
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}
// }