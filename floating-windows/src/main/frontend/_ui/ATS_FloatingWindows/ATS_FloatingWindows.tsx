import * as React from 'react';
import {AppToolsScreen, Button, ComponentSync, LL_H_C, LL_V_L} from '@nu-art/thunderstorm/frontend';
import {thunderstormCapabilitiesGroup} from '@nu-art/thunderstorm/frontend/consts';
import {Model_FloatingWindow} from '../../types';
import {ModuleFE_FloatingWindows} from '../../_modules/ModuleFE_FloatingWindows';

class ATS_FloatingWindows_Class
	extends ComponentSync {

	private openWindow1 = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-1',
			content: (cb) => this.renderWindowContent('Window 1', cb),
			resizable: true,
			moveable: true,
			rect: {
				y: 200,
				x: 20
			}
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	private openWindow2 = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-2',
			content: (cb) => this.renderWindowContent('Window 2', cb),
			resizable: true,
			moveable: true,
			rect: {
				y: 200,
				x: 220
			}
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	render() {
		return <LL_V_L>
			<Button variant={'primary'} onClick={this.openWindow1}>Open Window 1</Button>
			<Button variant={'primary'} onClick={this.openWindow2}>Open Window 2</Button>
		</LL_V_L>;
	}

	private renderWindowContent = (content: string, cb: VoidFunction) => {
		return <LL_H_C style={{gap: 10}}>
			{content}
			<Button variant={'secondary'} onClick={cb}>Close</Button>
		</LL_H_C>;
	};
}

export const ATS_FloatingWindows: AppToolsScreen = {
	key: 'ats__floating-windows',
	name: 'Floating Windows',
	renderer: ATS_FloatingWindows_Class,
	group: thunderstormCapabilitiesGroup
};