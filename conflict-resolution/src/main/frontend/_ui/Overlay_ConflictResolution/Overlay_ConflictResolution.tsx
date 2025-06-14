import {DBEntityDependencies} from '@nu-art/thunderstorm';
import {ComponentSync} from '@nu-art/thunderstorm/frontend';
import './Overlay_ConflictResolution.scss';
import {Panel_ConflictResolution} from '../Panel_ConflictResolution/Panel_ConflictResolution';
import {OnShowConflictResolution} from '../../_dispatchers';

type State = {
	dependencies?: DBEntityDependencies
};

export class Overlay_ConflictResolution
	extends ComponentSync<{}, State>
	implements OnShowConflictResolution {

	__onShowConflictResolution = (dependencies?: DBEntityDependencies) => {
		this.setState({dependencies});
	};

	render() {
		if (!this.state.dependencies)
			return <></>;

		return <Panel_ConflictResolution dependencies={this.state.dependencies}/>;
	}
}