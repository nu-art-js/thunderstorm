import * as React from 'react';
import {ModuleFE_Utils} from '../../modules/ModuleFE_Utils/ModuleFE_Utils';
import {ComponentSync} from '../../core/ComponentSync';

type Props = {
	rendererKey: keyof typeof ModuleFE_Utils.renderers,
	props: any
}

type State = {
	currentRenderer: React.ComponentType
}

export class Component_GenericRenderer
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.currentRenderer = ModuleFE_Utils.getRenderer(nextProps.rendererKey, nextProps.props);
		return state;
	}

	render() {
		const Renderer = this.state.currentRenderer;
		return <Renderer {...this.props.props}/>;
	}
}
