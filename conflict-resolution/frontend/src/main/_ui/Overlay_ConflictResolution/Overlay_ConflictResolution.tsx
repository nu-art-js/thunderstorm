/*
 * @nu-art/conflict-resolution-frontend - Conflict resolution overlay component
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DBEntityDependencies} from '@nu-art/conflict-resolution-shared';
import {ComponentSync} from '@nu-art/thunder-widgets';
import './Overlay_ConflictResolution.scss';
import {Panel_ConflictResolution} from '../Panel_ConflictResolution/Panel_ConflictResolution.js';
import {OnShowConflictResolution} from '../../_dispatchers/index.js';

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