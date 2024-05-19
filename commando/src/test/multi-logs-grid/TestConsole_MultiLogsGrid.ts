import {ConsoleScreen} from '../../main/console/ConsoleScreen';
import {BadImplementationException, LogClient_MemBuffer, exists, removeItemFromArray} from '@nu-art/ts-common';


export class TestConsole_MultiLogsGrid
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

	protected createWidgets() {
		const logs = this.state.logs;

		const fittingGrid = gridPreset[logs.length - 1];
		if (!exists(fittingGrid))
			return;

		if (!fittingGrid)
			throw new Error(`No preset available for this number of cells ${logs.length}`);

		let index = 0;
		let xPos = 0;
		fittingGrid.forEach(column => {
			let yPos = 0;
			column.forEach(cell => {
				const [fracWidth, fracHeight] = cell;
				const width = 100 * fracWidth;
				const height = 100 * fracHeight;

				this.createWidget('log', {
					top: `${yPos}%`,
					left: `${xPos}%`,
					width: `${width}%`,
					height: `${height}%`,
					label: ` Log for ${logs[index++].key} `,
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

				yPos += height;  // Assumes all cells in a column have the same height
			});
			xPos += column[0][0] * 100;
		});
	}

	registerApp(appKey: string, logClient: LogClient_MemBuffer) {
		const logs = this.state.logs;
		const foundLog = logs.find(log => log.key === appKey);
		if (foundLog)
			throw new BadImplementationException(`already have log for appkey: ${appKey}`);

		logs.push({key: appKey, logClient});
		this.dispose();
		this.create();

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

		this.dispose();
		this.create();

		this.setState({logs});
	}

	protected render(): void {
		this.state.logs.forEach((log, i) => {
			this.widgets[i]?.setContent(log.logClient.buffers[0] ?? 'asdsd');
		});
	}
}

type GridCell = [number, number];  // Represents [fractionWidth, fractionHeight]
type GridColumn = GridCell[];
const columnOf1_halfWidth: GridColumn = [[0.5, 1]];
const columnOf2_halfWidth: GridColumn = [[0.5, 0.5], [0.5, 0.5]];
const columnOf3_halfWidth: GridColumn = [[0.5, 1 / 3], [0.5, 1 / 3], [0.5, 1 / 3]];
const columnOf2_3rdWidth: GridColumn = [[1 / 3, 0.5], [1 / 3, 0.5]];
const columnOf3_3rdWidth: GridColumn = [[1 / 3, 1 / 3], [1 / 3, 1 / 3], [1 / 3, 1 / 3]];
const gridPreset: GridColumn[][] = [
	[[[1, 1]]],
	[columnOf1_halfWidth, columnOf1_halfWidth],
	[columnOf2_halfWidth, columnOf1_halfWidth],
	[columnOf2_halfWidth, columnOf2_halfWidth],
	[columnOf3_halfWidth, columnOf2_halfWidth],
	[columnOf3_halfWidth, columnOf3_halfWidth],
	[columnOf3_3rdWidth, columnOf2_3rdWidth, columnOf2_3rdWidth],
	[columnOf3_3rdWidth, columnOf3_3rdWidth, columnOf2_3rdWidth],
	[columnOf3_3rdWidth, columnOf3_3rdWidth, columnOf3_3rdWidth],
];