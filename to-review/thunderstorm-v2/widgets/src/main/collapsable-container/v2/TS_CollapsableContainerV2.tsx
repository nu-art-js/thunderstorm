import * as React from 'react';
import './TS_CollapsableContainerV2.scss';
import {ComponentSync} from '../../_core/ComponentSync.js';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C, LL_V_L} from '../../layouts/index.js';
import {exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';

export type Props_TS_CollapsableContainerV2 = {
	headerRenderer: ResolvableContent<React.ReactNode>;
	containerRenderer: ResolvableContent<React.ReactNode>;
	customCaret?: ResolvableContent<React.ReactNode>;
	onCollapseToggle?: (collapseState: boolean, e: React.MouseEvent) => void;
	collapsed?: boolean;
	initialCollapsed?: boolean;
	className?: string;
	style?: React.CSSProperties;
	id?: string;
	onHeaderRightClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	forceUpdate?: boolean;
	animated?: boolean;
	innerRef?: React.RefObject<HTMLDivElement>;
};
type State = {
	collapsed: boolean;
	animated: boolean;
	className?: string;
	style?: React.CSSProperties;
	id?: string;
};

export class TS_CollapsableContainerV2
	extends ComponentSync<Props_TS_CollapsableContainerV2, State> {
	protected deriveStateFromProps(nextProps: Props_TS_CollapsableContainerV2, state: State): State {
		state.collapsed = nextProps.collapsed ?? this.state?.collapsed ?? (nextProps.initialCollapsed ?? true);
		state.animated = !!nextProps.animated;
		state.className = nextProps.className;
		state.style = nextProps.style;
		state.id = nextProps.id;
		return state;
	}

	shouldComponentUpdate(nextProps: Readonly<Props_TS_CollapsableContainerV2>, nextState: Readonly<State>, nextContext: any) {
		if (nextProps.forceUpdate)
			return true;
		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}

	private toggleCollapse = (e: React.MouseEvent) => {
		const currentCollapsed = this.state.collapsed;
		if (exists(this.props.onCollapseToggle))
			return this.props.onCollapseToggle(currentCollapsed, e);
		this.setState({collapsed: !currentCollapsed});
	};

	render() {
		const className = _className('ts-collapsable-container-v2', this.state.collapsed && 'collapsed', this.state.animated && 'animated', this.state.className);
		return <LL_V_L id={this.state.id} className={className} style={this.state.style} innerRef={this.props.innerRef}>
			{this.render_Header()}
			{this.render_Content()}
		</LL_V_L>;
	}

	private render_Header() {
		return <LL_H_C className={'ts-collapsable-container-v2__header'} onClick={this.toggleCollapse} onContextMenu={this.props.onHeaderRightClick}>
			{this.render_Header_Caret()}
			<div className={'ts-collapsable-container-v2__header-content'}>{resolveContent(this.props.headerRenderer)}</div>
		</LL_H_C>;
	}

	private render_Header_Caret = () => {
		if (!exists(this.props.customCaret))
			return <TS_Icons.treeCollapse.component/>;
		return resolveContent(this.props.customCaret);
	};

	private render_Content() {
		return <div className={'ts-collapsable-container-v2__content'}>
			<div className={'ts-collapsable-container-v2__content-inner'}>
				{resolveContent(this.props.containerRenderer)}
			</div>
		</div>;
	}
}
