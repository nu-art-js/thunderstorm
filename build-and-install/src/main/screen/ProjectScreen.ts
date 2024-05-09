// @ts-ignore
import * as blessed from 'neo-blessed';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';

export type PackageStatus = {
	packageName: string,
	status: string,
	error?: string
};

type CurrentRunningPhase = { phaseName: string };

export class ProjectScreen {
	public readonly packageData: PackageStatus[];
	private currentRunningPhase!: CurrentRunningPhase;
	private readonly screen: blessed.Widgets.Screen;
	private readonly phaseBox: blessed.Widgets.BoxElement;
	private readonly packageTable: blessed.Widgets.TableElement;

	constructor(initialData: PackageStatus[]) {
		this.packageData = initialData;
		this.screen = blessed.screen({
			smartCSR: true,
			title: 'Build and install',
		});

		this.screen.key(['escape', 'q', 'C-c'], () => {
			return process.exit(1); // Quit on q, esc, or ctrl-c
		});

		// Create the UI components
		this.phaseBox = blessed.box({
			parent: this.screen,
			top: 2,
			left: 'center',
			width: '40%',
			height: 2,
			content: '',
			tags: true,
			style: {
				border: {fg: 'blue'},
				fg: 'white',
				bg: 'blue',
			},
			valign: 'middle',
			align: 'center'
		});

		this.packageTable = blessed.listtable({
			parent: this.screen,
			top: 'center',
			left: 'left',
			width: '100%',
			height: '70%',
			keys: true,
			mouse: true,
			border: {type: 'line'},
			align: 'left',
			tags: true,
			style: {
				border: {fg: 'green'},
				header: {bold: true},
				cell: {fg: 'white', selected: {bg: 'blue'}}
			},
			interactive: true,
			scrollbar: {
				ch: ' ',
				track: {
					bg: 'grey'
				},
			}
		});

	}

	public renderScreen = () => {
		this.renderCurrentRunningPhase();
		this.renderPackageTableTable();
		this.screen.render();
	};

	public endRun = () => {
		process.exit(0);
	};

	private renderCurrentRunningPhase = () => {
		const content = `Phase Name: ${this.currentRunningPhase?.phaseName ?? 'No Phase'}\n`;
		this.phaseBox.setContent(content);
	};

	private renderPackageTableTable = () => {
		const scrollPosition = this.packageTable.getScroll();
		const selectedIndex = this.packageTable.selected;

		const data = [
			['Package Name', 'Status', 'Error'],
			...this.packageData.map(pkg => [pkg.packageName, pkg.status, pkg.error ?? '-'])
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