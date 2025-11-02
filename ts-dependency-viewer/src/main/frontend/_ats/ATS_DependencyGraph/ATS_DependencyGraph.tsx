import {AppToolsScreen, ATS_Frontend, ComponentSync} from '@nu-art/thunderstorm/frontend/index';
import {Component_DependencyViewer} from '../../dependency-viewer/Component_DependencyViewer.js';


type State = {}

export class ATS_DependencyViewer
	extends ComponentSync<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Dependency Graph',
		key: 'dependency-graph',
		renderer: this,
		group: ATS_Frontend
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		return state;
	}

	render() {
		return <Component_DependencyViewer/>;
	}
}
