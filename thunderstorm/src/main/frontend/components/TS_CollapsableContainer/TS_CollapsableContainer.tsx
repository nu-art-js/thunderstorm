import {TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {_className, ComponentSync, LL_V_L} from '../..';
import './TS_CollapsableContainer.scss';
import {ReactNode} from 'react';

type Props = {
	headerRenderer: ReactNode | (() => ReactNode);
	containerRenderer: ReactNode | ((contentRef: React.RefObject<any>) => ReactNode);
	collapsed?: boolean;
	showCaret?: boolean
	onCollapseToggle?: (collapseState: boolean) => void;
	style?: TypedMap<string>;
	className?: string;
	customCaret?: ReactNode | (() => ReactNode)
	flipHeaderOrder?: boolean
	onMouseEnter?: (e: React.MouseEvent) => void;
	onMouseLeave?: (e: React.MouseEvent) => void;
}

type State = {
	collapsed: boolean;
	contentRef: React.RefObject<any>;
	containerRef: React.RefObject<HTMLDivElement>;
}

export class TS_CollapsableContainer
	extends ComponentSync<Props, State> {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props): State {
		const state = this.state ? {...this.state} : {} as State;
		state.collapsed = nextProps.collapsed ?? this.state?.collapsed ?? true;
		state.contentRef ??= React.createRef();
		state.containerRef ??= React.createRef();
		return state;
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
		this.setContainerHeight();
	}

	componentDidMount() {
		if (this.state.collapsed)
			this.setContainerHeight();
		else
			setTimeout(() => this.setContainerHeight(), 10);
	}

	//TODO: check if this is still supposed to be here
	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		// let res = super.shouldComponentUpdate(nextProps, nextState, nextContext);
		// if (!res)
		// 	res = !compare(this.props.collapsed, nextProps.collapsed);
		// return res;
		return true;
	}

	//######################### Logic #########################

	private setContainerHeight = () => {
		if (!this.state.containerRef.current)
			return;
		const currentContent = this.state.contentRef.current;
		const maxHeight = this.state.collapsed
			? 0
			: currentContent ? currentContent.getBoundingClientRect().height : 200;
		this.state.containerRef.current.style.maxHeight = `${maxHeight}px`;
	};

	private toggleCollapse = () => {
		//If component is controlled, return
		this.props.onCollapseToggle?.(this.isCollapsed());
		if (this.props.collapsed !== undefined)
			return;

		this.setState({collapsed: !this.state.collapsed});
	};

	private isCollapsed() {
		//Return the collapse from props if controlled, otherwise state
		return this.props.collapsed !== undefined ? this.props.collapsed : this.state.collapsed;
	}

	//######################### Render #########################

	private renderCaret() {
		if (this.props.showCaret === false)
			return '';
		const collapsed = this.isCollapsed();
		const className = _className('ts-collapsable-container__header__caret', collapsed ? 'collapsed' : undefined);

		if (this.props.customCaret)
			return <span className={className}>
			{typeof this.props.customCaret === 'function' ? this.props.customCaret() : this.props.customCaret}
		</span>;

		return <span className={className}>
			{this.isCollapsed() ? '+' : '-'}
		</span>;
	}

	renderHeader() {
		const className = _className('ts-collapsable-container__header', this.isCollapsed() ? 'collapsed' : undefined, this.props.flipHeaderOrder ? 'flip' : undefined);
		return <div className={className} onClick={this.toggleCollapse}>
			{this.renderCaret()}
			{typeof this.props.headerRenderer === 'function' ? this.props.headerRenderer() : this.props.headerRenderer}
		</div>;
	}

	renderContainer() {
		const className = _className('ts-collapsable-container__container', this.isCollapsed() ? 'collapsed' : undefined);
		return <div className={className} ref={this.state.containerRef}>
			{(typeof this.props.containerRenderer === 'function' ? this.props.containerRenderer(this.state.contentRef) : this.props.containerRenderer)}
		</div>;
	}

	render() {
		const className = _className('ts-collapsable-container', this.props.className);
		return <LL_V_L className={className} style={this.props.style} onMouseEnter={this.props.onMouseEnter} onMouseLeave={this.props.onMouseLeave}>
			{this.renderHeader()}
			{this.renderContainer()}
		</LL_V_L>;
	}
}
