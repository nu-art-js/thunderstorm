import * as React from 'react';
import {ComponentSync} from '@nu-art/thunderstorm/frontend/index';
import {ModuleFE_FloatingWindows} from '../../_modules/ModuleFE_FloatingWindows.js';
import {FloatingWindows_WindowsUpdated} from '../../_dispatchers/models-updated.js';
import './TS_FloatingWindows.scss';
import {Model_FloatingWindow} from '../../types.js';
import {TS_FloatingWindow} from '../TS_FloatingWindow/TS_FloatingWindow.js';

type State = {
	windowModels: Model_FloatingWindow[];
};

export class TS_FloatingWindows
	extends ComponentSync<unknown, State>
	implements FloatingWindows_WindowsUpdated {

	//######################### Life Cycle #########################

	__onFloatingWindowsUpdated = () => {
		this.forceUpdate();
	};

	protected deriveStateFromProps(nextProps: unknown, state: State) {
		state.windowModels ??= ModuleFE_FloatingWindows.windowModels;
		return state;
	}

	componentDidUpdate() {
		if (!this.state.windowModels.length)
			TS_FloatingWindow.runningZIndex = 0;
	}

	//######################### Logic #########################

	//######################### Render #########################

	render() {
		if (!this.state.windowModels?.length)
			return;

		return <div id={'ts-floating-windows'}>
			{this.state.windowModels.map(model => {
				return <TS_FloatingWindow
					key={model.key}
					model={model}
				/>;
			})}
		</div>;
	}
}

