// @ts-ignore
import * as blessed from 'neo-blessed';

import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {_logger_finalDate, _logger_getPrefix, _logger_timezoneOffset, LogClient_MemBuffer, LogLevel} from '@nu-art/ts-common';
import {ConsoleScreen} from '@nu-art/commando/console/ConsoleScreen';
import {BlessedWidget} from '@nu-art/commando/console/types';


export type PackageStatus = {
	packageName: string,
	status: string,
	error?: string
};

type CurrentRunningPhase = { phaseName: string };
type State = {
	packageData: PackageStatus[],
	currentRunningPhase: CurrentRunningPhase
}

export class ProjectScreen
	extends ConsoleScreen<State> {

	private phase!: BlessedWidget['text'];
	private packageTable!: BlessedWidget['listTable'];
	private logger!: BlessedWidget['log'];

	readonly logClient = new LogClient_MemBuffer('output.txt');

	constructor(initialData: PackageStatus[]) {
		super({
				smartCSR: true,
				title: 'Build and install',
			}, [{
				keys: ['escape', 'q', 'C-c'],
				callback: async () => {
					return process.exit(1); // Quit on q, esc, or ctrl-c
				}
			}]
		);
		this.setState({
			packageData: initialData
		});

		this.logClient.setForTerminal();
		this.logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `  ${date} ${_logger_getPrefix(level)} ${tag}:  `;
		});

		this.logClient.setLogAppendedListener(() => {
			this.setState({});
		});
	}

	getPackageData() {
		return this.state.packageData;
	}

	protected createContent() {
		this.phase = this.createWidget('text', {
			top: 0,
			left: 0,
			height: 3,
			width: '40%',
			content: 'phases',
			border: {type: 'line'},
			tags: true,
			style: {
				border: {fg: 'green'},
				fg: 'green',
			},
			align: 'center'
		});

		this.packageTable = this.createWidget('listTable', {
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

		this.createWidget('text', {
			top: 0,
			right: 0,
			width: '60%',
			height: 3,
			border: {type: 'line'},
			content: 'Log',
			tags: true,
			style: {
				border: {fg: 'green'},
				fg: 'green',
			},
			align: 'center',
		});

		this.logger = this.createWidget('log', {
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

	protected render() {
		this.renderCurrentRunningPhase();
		this.renderPackageTableTable();
		this.logger.setContent(this.logClient.buffers[0]);
	}

	private renderCurrentRunningPhase = () => {
		const content = `Phase Name: ${this.state?.currentRunningPhase?.phaseName ?? 'No Phase'}\n`;
		this.phase.setContent(content);
	};

	private renderPackageTableTable = () => {
		const scrollPosition = this.packageTable.getScroll();

		const data = [
			['Package Name', 'Status'],
			...(this.state.packageData ?? []).map(pkg => [pkg.packageName, pkg.status])
		];

		this.packageTable.setData(data);
		this.packageTable.setScroll(scrollPosition);
	};

	public updateOrCreatePackage = (name: string, status: string, error?: string): void => {
		const packageData = this.state.packageData;
		const index = packageData.findIndex(pkg => pkg.packageName === name);
		if (index !== -1) {
			packageData[index].status = status;
			packageData[index].error = error;
		} else {
			packageData.push({packageName: name, status});
		}
		this.setState({packageData});
	};

	public updateRunningPhase = (name: string): void => {
		this.setState({currentRunningPhase: {phaseName: name}});
	};
}

export const MemKey_ProjectScreen = new MemKey<ProjectScreen>('project-screen');