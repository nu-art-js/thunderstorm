import {AppToolsScreen, ATS_Frontend} from '@nu-art/thunder-ui-modules';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {Component_DependencyViewer} from '../../dependency-viewer/Component_DependencyViewer.js';

type State = Record<string, never>;

export class ATS_DependencyViewer
	extends ComponentSync<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Dependency Graph',
		key: 'dependency-graph',
		renderer: ATS_DependencyViewer,
		group: ATS_Frontend
	};

	protected deriveStateFromProps(nextProps: {}, state: State): State {
		return state;
	}

	render() {
		return <Component_DependencyViewer/>;
	}
}
