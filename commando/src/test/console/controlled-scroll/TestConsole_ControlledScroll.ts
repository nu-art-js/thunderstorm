import {ConsoleScreen} from '../../../main/console/ConsoleScreen';
import {BlessedWidget} from '../../../main/console/types';


interface LogScreenState {
	logs: string;
}

export class TestConsole_ControlledScroll
	extends ConsoleScreen<LogScreenState> {
	private logElement!: BlessedWidget['log'];

	constructor() {
		super(
			{
				smartCSR: true,
				title: 'Controlled-Scroll-Logs',
			},
			[
				{
					keys: ['C-c'], // Exit on Control-C
					callback: () => process.exit(0),
				},
				{
					keys: ['up'], // Scroll up on Control-U
					callback: () => this.scrollLog(-1),
				},
				{
					keys: ['down'], // Scroll down on Control-D
					callback: () => this.scrollLog(1),
				},
			]
		);

		this.state = {logs: logs};
	}

	protected createContent() {
		this.logElement = this.createWidget('log', {
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			label: ' Logs',
			border: {type: 'line'},
			scrollbar: {
				ch: ' ',
				track: {
					bg: 'grey',
				},
				style: {
					inverse: true,
				},
			},
		});
	}

	protected render(): void {
		this.logElement.setContent(this.state.logs);
	}

	private addLog(log: string) {
		this.setState({logs: `${this.state.logs}\n${log}`});
		this.render();
	}

	private scrollLog(direction: number) {
		this.logElement.scroll(direction);
		this.logElement.setLabel(`Scrolled position ${this.logElement.getScroll()}`);
		this.container.screen.render();
	}
}

let logs = '';
for (let i = 0; i < 5000; i++) {
	logs += `${String(i).padStart(3, '0')}\n`;
}
