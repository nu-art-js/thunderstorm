import {ConsoleScreen} from '../../main/console/ConsoleScreen';
import {Widgets} from 'neo-blessed';


interface LogScreenState {
	logs: string[];
}

export class TestConsole_PartialSelection
	extends ConsoleScreen<LogScreenState> {
	private logWidgets: Widgets.Log[] = [];

	constructor() {
		super({
			smartCSR: true,
			title: 'Multiple Logs Example',
		}, [
			{
				keys: ['escape', 'q', 'C-c'],
				callback: () => process.exit(0),
			}
		]);

		this.state = {
			logs: ['Log 1', 'Log 2', 'Log 3'],
		};
	}

	protected createContent() {
		const logWidgetHeight = Math.floor(100 / this.state.logs.length);
		this.state.logs.forEach((log, index) => {
			const logWidget = this.createWidget('log', {
				top: `${logWidgetHeight * index}%`,
				left: 'center',
				width: '80%',
				height: `${logWidgetHeight}%`,
				label: ` ${log} `,
				border: {
					type: 'line',
				},
				scrollable: true,
				alwaysScroll: true,
				scrollbar: {
					ch: ' ',
				},
				style: {
					border: {
						fg: 'magenta',
					},
				},
				mouse: true,
				keys: true,
				vi: true,
			}) as Widgets.Log;

			// Add click event listener to set focus on click
			logWidget.on('click', () => {
				logWidget.focus();
				this.container.screen.render();
			});

			this.logWidgets.push(logWidget);
		});
	}

	protected render() {
		// Render logic for updating log content
		this.logWidgets.forEach((widget, index) => {
			widget.setContent(`Content of ${this.state.logs[index]}`);
		});
	}
}