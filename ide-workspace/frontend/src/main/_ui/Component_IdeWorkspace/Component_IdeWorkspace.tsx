import {ComponentSync} from '@nu-art/thunder-widgets';
import './Component_IdeWorkspace.scss';
import {OnIdeWorkspaceLayout, dispatch_OnIdeWorkspaceLayoutUpdated} from '../../dispatchers.js';

type Props = {};
type State = {};

export class Component_IdeWorkspace
	extends ComponentSync<Props, State>
	implements OnIdeWorkspaceLayout {

	__onIdeWorkspaceLayoutUpdated = () => {
		this.forceUpdate();
	};

	protected deriveStateFromProps(nextProps: Readonly<Props>, state: State): State {
		dispatch_OnIdeWorkspaceLayoutUpdated.dispatchModule(this);
		return state;
	}

	render() {
		return <div className="component-ide-workspace">IDE Workspace</div>;
	}
}
