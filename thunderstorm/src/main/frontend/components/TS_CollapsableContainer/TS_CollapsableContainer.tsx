import {compare} from '@nu-art/ts-common';
import * as React from 'react';
import {_className, ComponentSync, LL_V_L} from '../..';
import './TS_CollapsableContainer.scss';

type Props = {
	headerRenderer: React.ReactNode | (() => React.ReactNode);
	containerRenderer: React.ReactNode | (() => React.ReactNode);
	collapsed?: boolean;
	onCollapseToggle?: (collapseState: boolean) => void;
}

type State = {
	collapsed: boolean;
}

export class TS_CollapsableContainer extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props): State {
		return {collapsed: true};
	}

	private toggleCollapse = () => {
		//If component is controlled, return
		this.props.onCollapseToggle?.(this.isCollapsed());
		if (this.props.collapsed !== undefined) {
			return;
		}

		this.setState({collapsed: !this.state.collapsed});
	};

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		let res = super.shouldComponentUpdate(nextProps, nextState, nextContext);
		if (!res)
			res = !compare(this.props.collapsed, nextProps.collapsed);
		return res;
	}

	private isCollapsed() {
		//Return the collapse from props if controlled, otherwise state
		return this.props.collapsed !== undefined ? this.props.collapsed : this.state.collapsed;
	}

	renderHeader() {
		const className = _className('ts-collapsable-container__header', this.isCollapsed() ? 'collapsed' : undefined);
		return <div className={className} onClick={this.toggleCollapse}>
			<span className={'ts-collapsable-container__header__caret'}>{this.state.collapsed ? '+' : '-'}</span>
			{/*<TS_Icons.arrow className={_className(this.state.collapsed ? 'collapsed' : undefined)}/>*/}
			{typeof this.props.headerRenderer === 'function' ? this.props.headerRenderer() : this.props.headerRenderer}
		</div>;
	}

	renderContainer() {
		const className = _className('ts-collapsable-container__container', this.isCollapsed() ? 'collapsed' : undefined);
		return <div className={className}>
			{(typeof this.props.containerRenderer === 'function' ? this.props.containerRenderer() : this.props.containerRenderer)}
		</div>;
	}

	render() {
		return <LL_V_L className={'ts-collapsable-container'}>
			{this.renderHeader()}
			{this.renderContainer()}
		</LL_V_L>;
	}
}