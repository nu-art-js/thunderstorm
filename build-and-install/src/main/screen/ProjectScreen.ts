// @ts-ignore
import {blessed} from 'neo-blessed';

import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	LogClient_MemBuffer,
	LogLevel
} from '@nu-art/ts-common';


export type PackageStatus = {
	packageName: string,
	status: string,
	error?: string
};

type CurrentRunningPhase = { phaseName: string };

export class ProjectScreen {
	public readonly packageData: PackageStatus[];
	private currentRunningPhase!: CurrentRunningPhase;

	private screen: blessed.Widgets.Screen;
	private phaseBox: blessed.Widgets.BoxElement;
	private packageTable: blessed.Widgets.TableElement;
	private logger: blessed.Widgets.LogElement;
	private titleElement: blessed.Widgets.TextElement;
	readonly logClient = new LogClient_MemBuffer('output.txt');
	private enabled = false;

	constructor(initialData: PackageStatus[]) {
		this.packageData = initialData;
		this.logClient.setForTerminal();
		this.logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
		});

		this.logClient.setLogAppendedListener(() => {
			this.renderScreen();
		});
	}

	enable() {
		this.enabled = true;
		this.screen = blessed.screen({
			smartCSR: true,
			title: 'Build and install',
		});

		this.screen.key(['escape', 'q', 'C-c'], () => {
			return process.exit(1); // Quit on q, esc, or ctrl-c
		});

		// Create the UI components
		this.phaseBox = blessed.text({
			parent: this.screen,
			top: 0,
			left: 0,
			height: 3,
			width: '40%',
			content: 'phases',
			border: {type: 'line'},
			tags: true,
			style: {
				border: {fg: 'green'},
				fg: 'black',
			},
			align: 'center'
		});

		this.packageTable = blessed.listtable({
			parent: this.screen,
			top: 3,
			left: 0,
			width: '40%',
			height: '70%',
			keys: true,
			border: {type: 'line'},
			align: 'left',
			tags: true,
			style: {
				border: {fg: 'blue'},
				header: {bold: true},
				cell: {fg: 'white', selected: {bg: 'blue'}}
			},
			mouse: true,
			interactive: true,
			scrollbar: {
				ch: ' ',
				track: {
					bg: 'grey'
				},
			}
		});

		this.titleElement = blessed.text({
			parent: this.screen,
			top: 0,
			right: 0,
			width: '60%',
			height: 3,
			border: {type: 'line'},
			content: 'Log',
			tags: true,
			style: {
				border: {fg: 'green'},
				fg: 'black',
			},
			align: 'center'
		});

		this.logger = blessed.log({
			parent: this.screen,
			top: 3,
			right: 0,
			width: '60%',
			mouse: true,
			interactive: true,
			bottom: '0',
			tags: true,
			border: {type: 'line'},
			style: {
				border: {fg: 'blue'},
				fg: 'white',
			},
			valign: 'top',
			align: 'left'
		});
	}

	disable() {
		this.enabled = false;
		if (!this.screen)
			return;

		this.phaseBox.detach();
		this.packageTable.detach();
		this.titleElement.detach();
		this.logger.detach();
		this.screen.detach();
		this.screen.clear();
		this.screen.destroy();
		process.stdout.write('\x1bc');  // This sends the terminal reset escape code
	}

	public renderScreen = () => {
		if (!this.enabled)
			return;

		this.renderCurrentRunningPhase();
		this.renderPackageTableTable();
		this.logger.setContent(this.logClient.buffers[0]);
		this.screen.render();
	};

	public endRun = () => {
		this.disable();
		console.log(this.logClient.buffers[0]);
	};

	private renderCurrentRunningPhase = () => {
		const content = `Phase Name: ${this.currentRunningPhase?.phaseName ?? 'No Phase'}\n`;
		this.phaseBox.setContent(content);
	};

	private renderPackageTableTable = () => {
		const scrollPosition = this.packageTable.getScroll();
		const selectedIndex = this.packageTable.selected;

		const data = [
			['Package Name', 'Status'],
			...this.packageData.map(pkg => [pkg.packageName, pkg.status])
		];

		this.packageTable.setData(data);
		this.packageTable.select(selectedIndex);
		this.packageTable.setScroll(scrollPosition);
	};

	public updateOrCreatePackage = (name: string, status: string, error?: string): void => {
		const index = this.packageData.findIndex(pkg => pkg.packageName === name);
		if (index !== -1) {
			this.packageData[index].status = status;
			this.packageData[index].error = error;
			return this.renderScreen();
		}

		this.packageData.push({packageName: name, status});
		this.renderScreen();
	};

	public updateRunningPhase = (name: string): void => {
		this.currentRunningPhase = {phaseName: name};
		this.renderScreen();
	};
}

export const MemKey_ProjectScreen = new MemKey<ProjectScreen>('project-screen');