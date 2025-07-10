import * as React from 'react';
import './TS_CollapsableContainerV2.scss';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import {LL_H_C, LL_V_L} from '../Layouts';
import {exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';


type Props = {
	//Render Props
	headerRenderer: ResolvableContent<React.ReactNode>;
	containerRenderer: ResolvableContent<React.ReactNode>;
	customCaret?: ResolvableContent<React.ReactNode>;
	//State Control Props
	onCollapseToggle?: (collapseState: boolean, e: React.MouseEvent) => void;
	collapsed?: boolean;
	initialCollapsed?: boolean;
	//Additional Props
	className?: string;
	id?: string;
	onHeaderRightClick?: (e: React.MouseEvent) => void;
	forceUpdate?: boolean; //Force component to update when parent component updates. essential if inner components receive props
	animated?: boolean;
}

type State = {
	collapsed: boolean;
	animated: boolean;
	className?: string;
	id?: string;
}

export class TS_CollapsableContainerV2
	extends ComponentSync<Props, State> {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.collapsed = nextProps.collapsed ?? this.state?.collapsed ?? (nextProps.initialCollapsed ?? true);
		state.animated = !!nextProps.animated;
		state.className = nextProps.className;
		state.id = nextProps.id;
		return state;
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any) {
		if (nextProps.forceUpdate)
			return true;

		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}

	//######################### Logic #########################

	private toggleCollapse = (e: React.MouseEvent) => {
		const currentCollapsed = this.state.collapsed;
		if (exists(this.props.onCollapseToggle))
			return this.props.onCollapseToggle(currentCollapsed, e);

		this.setState({collapsed: !currentCollapsed});
	};

	//######################### Render #########################

	render() {
		const className = _className(
			'ts-collapsable-container-v2',
			this.state.collapsed && 'collapsed',
			this.state.animated && 'animated',
			this.state.className,
		);
		return <LL_V_L id={this.state.id} className={className}>
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