import * as React from 'react';
import {ComponentSync, LL_V_L, _className} from '../..';
import './TS_CollapsableContainer.scss';

type Props = {
	headerRenderer: React.ReactNode | (() => React.ReactNode);
	containerRenderer: React.ReactNode | (() => React.ReactNode);
}

type State = {
	collapsed: boolean;
}

export class TS_CollapsableContainer extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props): State {
		return {collapsed: true};
	}

	private toggleCollapse = () => {
		this.setState({collapsed: !this.state.collapsed});
	};

	renderHeader() {
		const className = _className('ts-collapsable-container__header', this.state?.collapsed ? 'collapsed' : undefined);
		return <div className={className} onClick={this.toggleCollapse}>
			<span className={'ts-collapsable-container__header__caret'}>{this.state.collapsed ? '+' : '-'}</span>
			{/*<TS_Icons.arrow className={_className(this.state.collapsed ? 'collapsed' : undefined)}/>*/}
			{typeof this.props.headerRenderer === 'function' ? this.props.headerRenderer() : this.props.headerRenderer}
		</div>;
	}

	renderContainer() {
		const className = _className('ts-collapsable-container__container', this.state?.collapsed ? 'collapsed' : undefined);
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