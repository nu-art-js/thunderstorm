import {ConsoleScreen} from '../../main/console/ConsoleScreen';
import {BadImplementationException, LogClient_MemBuffer, removeItemFromArray} from '@nu-art/ts-common';


export class TestConsole_MultiLogs
	extends ConsoleScreen<{ logs: { key: string, logClient: LogClient_MemBuffer }[] }> {

	constructor() {
		super({
			smartCSR: true,
			title: 'Runtime-Logs',
			keyBinding: [
				{
					keys: ['C-c'],  // Example to submit form with Enter key
					callback: () => process.exit(0)
				}
			]

		});

		this.state = {logs: []};
	}

	registerApp(appKey: string, logClient: LogClient_MemBuffer) {
		const logs = this.state.logs;
		const foundLog = logs.find(log => log.key === appKey);
		if (foundLog)
			throw new BadImplementationException(`already have log for appkey: ${appKey}`);

		logs.push({key: appKey, logClient});
		this.recalculateWidgets(logs);

		logClient.setLogAppendedListener(() => {
			this.render();
			// might have a leak.. need to remove the listener at some point
		});
		this.setState({logs});
	}

	unregisterApp(appKey: string) {
		const foundLog = this.state.logs.find(log => log.key === appKey);
		if (!foundLog)
			throw new BadImplementationException(`Could not find log for appkey: ${appKey}`);

		const logs = this.state.logs;
		removeItemFromArray(logs, foundLog);

		this.recalculateWidgets(logs);
		this.setState({logs});
	}

	private recalculateWidgets(logs: { key: string; logClient: LogClient_MemBuffer }[]) {
		this.clearScreen(false);
		const totalApps = logs.length;
		const fraction = 100 / totalApps;
		logs.forEach((log, index) => {
			const top = `${(index * fraction).toFixed(0)}%`;
			const height = `${fraction.toFixed(0)}%`;
			this.createWidget('log', {
				top: top,
				left: 0,
				width: '100%',
				height: height,
				label: ` Log for ${log.key} `,
				border: {type: 'line'},
				scrollable: true,
				scrollbar: {
					ch: ' ',
					track: {
						bg: 'grey'
					},
					style: {
						inverse: true
					}
				},
				mouse: true
			});
		});
	}

	protected render(): void {
		this.state.logs.forEach((log, i) => {
			this.widgets[i].setContent(log.logClient.buffers[0]);
		});
	}
}
