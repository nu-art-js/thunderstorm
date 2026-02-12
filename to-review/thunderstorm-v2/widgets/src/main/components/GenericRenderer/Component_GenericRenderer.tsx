import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync.js';
import {ModuleFE_Utils} from '../../component-modules/ModuleFE_Utils.js';

type Props = {
	rendererKey: keyof typeof ModuleFE_Utils.renderers;
	props: any;
};

type State = {
	currentRenderer: React.ComponentType;
	props: any;
};

export class Component_GenericRenderer
	extends ComponentSync<Props, State> {
	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.currentRenderer = ModuleFE_Utils.getRenderer(nextProps.rendererKey, nextProps.props);
		state.props = nextProps.props;
		return state;
	}

	render() {
		const Renderer = this.state.currentRenderer;
		return <Renderer {...this.state.props}/>;
	}
}