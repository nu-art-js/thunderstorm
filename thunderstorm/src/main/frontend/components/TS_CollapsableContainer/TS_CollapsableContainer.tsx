import * as React from 'react';
import {ComponentSync, LL_V_L} from '../..';

type Props = {
	headerRenderer: React.ReactNode | (() => React.ReactNode);
	containerRenderer: React.ReactNode | (() => React.ReactNode);
}

type State = {
	collapsed: boolean;
}

export class TS_CollapsableContainer extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props): State | undefined {
		return undefined;
	}

	renderHeader() {
		return <div className={'ts-collapsable-container__header'}>
			{/*<TS_Icons.arrow className={_className(this.state.collapsed ? 'collapsed' : undefined)}/>*/}
			{typeof this.props.headerRenderer === 'function' ? this.props.headerRenderer() : this.props.headerRenderer}
		</div>;
	}

	renderContainer() {
		return <div className={'ts-collapsable-container__container'}>
			{typeof this.props.containerRenderer === 'function' ? this.props.containerRenderer() : this.props.containerRenderer}
		</div>;
	}

	render() {
		return <LL_V_L className={'ts-collapsable-container'}>
			{this.renderHeader()}
			{this.renderContainer()}
		</LL_V_L>;
	}
}