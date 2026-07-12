import {ComponentSync} from '@nu-art/thunder-widgets';
import './Component_IdeWorkspace.scss';
import {OnIdeWorkspaceLayout} from '../../dispatchers.js';

type Props = {};
type State = {};

export class Component_IdeWorkspace
	extends ComponentSync<Props, State>
	implements OnIdeWorkspaceLayout {

	__onIdeWorkspaceLayoutUpdated = () => {
		this.setState({});
	};

	render() {
		return <div className="component-ide-workspace">IDE Workspace</div>;
	}
}
