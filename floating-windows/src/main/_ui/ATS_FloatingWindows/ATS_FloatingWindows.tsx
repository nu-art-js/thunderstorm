import {AppToolsScreen, ATS_Frontend} from '@nu-art/thunder-ui-modules';
import {Button, ComponentSync, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import {Model_FloatingWindow} from '../../types.js';
import {ModuleFE_FloatingWindows} from '../../_modules/ModuleFE_FloatingWindows.js';
import {windowRect} from '../../_utils/get-window-rect.js';

class ATS_FloatingWindows_Class
	extends ComponentSync {

	private openHalfLeft = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-1',
			content: (cb) => this.renderWindowContent('Test Half Left', cb),
			resizable: true,
			moveable: true,
			rect: windowRect.halfScreen_Left()
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	private openHalfRight = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-2',
			content: (cb) => this.renderWindowContent('Test Half Right', cb),
			resizable: true,
			moveable: true,
			rect: windowRect.halfScreen_Right(),
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	private openThirdLeft = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-3',
			content: (cb) => this.renderWindowContent('Test Third Left', cb),
			resizable: true,
			moveable: true,
			rect: windowRect.thirdScreen_Left(),
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	private openThirdMiddle = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-4',
			content: (cb) => this.renderWindowContent('Test Third Middle', cb),
			resizable: true,
			moveable: true,
			rect: windowRect.thirdScreen_Middle(),
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	private openThirdRight = () => {
		const model: Model_FloatingWindow = {
			key: 'ats-window-5',
			content: (cb) => this.renderWindowContent('Test Third Right', cb),
			resizable: true,
			moveable: true,
			rect: windowRect.thirdScreen_Right(),
		};
		ModuleFE_FloatingWindows.window.add(model);
	};

	render() {
		return <LL_V_L style={{gap: 10}}>
			<Button variant={'primary'} onClick={this.openHalfLeft}>Open Half Left</Button>
			<Button variant={'primary'} onClick={this.openHalfRight}>Open Half Right</Button>
			<Button variant={'primary'} onClick={this.openThirdLeft}>Open Third Left</Button>
			<Button variant={'primary'} onClick={this.openThirdMiddle}>Open Third Middle</Button>
			<Button variant={'primary'} onClick={this.openThirdRight}>Open Third Right</Button>
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
	group: ATS_Frontend
};