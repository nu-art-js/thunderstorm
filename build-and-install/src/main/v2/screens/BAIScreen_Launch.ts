import {BAIScreen} from './BAIScreen';
import {BaseUnit} from '../unit/core';
import {MemKey_PhaseRunner} from '../phase-runner/consts';
import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../unit/firebase-units';
import {Widgets} from 'blessed';
import {PhaseRunner_OnUnitsChange} from '../phase-runner/PhaseRunnerDispatcher';
import {currentTimeMillis, getStringSize, KB, maxSubstring, MB, WhoCallThisException} from '@nu-art/ts-common';


type GridCell = { width: number; height: number };
type GridCol = GridCell[];
type GridDimensions = GridCol[];

export class BAIScreen_Launch
	extends BAIScreen
	implements PhaseRunner_OnUnitsChange {

	//######################### Properties #########################

	private allUnits: BaseUnit[] = [];
	private focusUnits: BaseUnit[] = [];
	private gridDimensions: GridDimensions = [[{width: 1, height: 1}]];
	private withRunningLogs: boolean = false;

	//Widgets
	private gridCellWidgets: Widgets.Log[] = [];

	//######################### Lifecycle #########################

	constructor() {
		super('bai-launch');
	}

	__onUnitsChange = (data: BaseUnit[]) => {
		this.updateUnits();
		this.rebuildScreens();
	};

	private rebuildScreens() {
		this.createGridWidgets();
		this.renderGridWidgets();
		this.container.screen.render();
	}

	protected onLogUpdated = () => {
		this.renderGridWidgets();
	};

	private updateUnits = () => {
		const runner = MemKey_PhaseRunner.get();
		this.allUnits = runner.getUnits().filter(unit => {
			return unit.isInstanceOf(Unit_FirebaseHostingApp) || unit.isInstanceOf(Unit_FirebaseFunctionsApp);
		});

		if (!this.focusUnits.length)
			this.focusUnits = this.allUnits;
	};

	//######################### Content Creation #########################

	protected createContent(): void {
		this.updateUnits();
		this.createGridWidgets();
	}

	protected scrollLog(direction: number) {
		const focusedWidget = this.getFocusedWidget();
		// @ts-ignore
		this.gridCellWidgets.find(log => log._label.content === focusedWidget._label.content)?.scroll(direction);
	}

	private createGridWidgets = () => {
		this.destroyGridWidgets();

		this.calculateGridDimensions();
		let xPos = 0;
		let widgetIndex = 0;
		this.gridDimensions.forEach((col) => {
			let yPos = 0;
			col.forEach((cell) => {
				const height = cell.height * 100;
				const width = cell.width * 100;
				const props: Widgets.LogOptions = {
					top: `${yPos}%`,
					left: `${xPos}%`,
					width: `${width}%`,
					height: `${height}%`,
					label: this.getGridWidgetLabel(widgetIndex),
					border: {type: 'line'},
					style: {
						hover: {border: {fg: 'blue'}},
						border: {fg: 'gray'},
						focus: {border: {fg: 'green'}}
					},
					valign: 'top',
					align: 'left',
					interactive: true,
					focusable: true,
				};

				const logWidget = this.createWidget('log', props);
				let doubleClickTimestamp = 0;
				const unitIndex = widgetIndex;
				logWidget.on('mouse', (event) => {
					if (!(event.button === 'middle' && event.action === 'mouseup'))
						return;

					if (currentTimeMillis() - doubleClickTimestamp < 500) {
						return this.toggleFullScreenMode(unitIndex);
					}

					doubleClickTimestamp = currentTimeMillis();
				});
				this.gridCellWidgets.push(logWidget);
				yPos += height; //Assuming all cells in a column have the same height
				widgetIndex++;
			});
			xPos += col[0].width * 100; //Assuming all Cells have the same width
		});
	};

	private toggleFullScreenMode(unitIndex: number) {
		if (this.focusUnits.length !== this.allUnits.length)
			this.focusUnits = this.allUnits;
		else
			this.focusUnits = [this.allUnits[unitIndex]];

		this.rebuildScreens();
	}

	private calculateGridDimensions = (count = this.focusUnits.length) => {
		//Add 1 more window for running logs
		if (this.withRunningLogs)
			count++;

		const grid: GridDimensions = [];
		const columns = Math.ceil(Math.sqrt(count)); // Calculate number of columns

		let remainingItems = count;
		for (let col = 0; col < columns; col++) {
			const column: GridCol = [];
			const itemsInThisColumn = Math.ceil(remainingItems / (columns - col));
			const height = 1 / itemsInThisColumn;

			for (let row = 0; row < itemsInThisColumn; row++) {
				column.push({width: 1 / columns, height});
			}

			grid.push(column);
			remainingItems -= itemsInThisColumn;
		}
		this.gridDimensions = grid;
	};

	private getGridWidgetLabel = (index: number): string => {
		const widgetLogs = this.getContentForWidget(index);

		if (!this.withRunningLogs)
			return `${this.focusUnits[index].config.label} - Log Size: ${getStringSize(widgetLogs, 'KB').toFixed(3)} KB`;

		return index === this.focusUnits.length ? 'Running Logs' : `${this.focusUnits[index].config.label} - Log Size: ${getStringSize(widgetLogs, 'KB').toFixed(3)} KB`;
	};

	//######################### Content Destruction #########################

	protected destroyContent() {
		this.destroyGridWidgets();
	}

	private destroyGridWidgets = () => {
		this.gridCellWidgets.forEach(widget => widget.destroy());
		this.gridCellWidgets.length = 0;
	};

	//######################### Render #########################

	protected render(): void {
		this.renderGridWidgets();
		this.logInfo('GRID DIMENSIONS', this.gridDimensions);
		this.logInfo('UNITS', this.focusUnits.map(unit => unit.config.label));
		this.logInfo('RUNNER UNITS', MemKey_PhaseRunner.get().getUnits().map(unit => unit.config.label));
	}

	private getContentForWidget = (widgetIndex: number) => {
		if (!this.withRunningLogs) {
			const unit = this.focusUnits[widgetIndex];
			if (!unit)
				throw new WhoCallThisException(`focusedUnits: ${this.focusUnits.length}[${widgetIndex}]`);

			const isFullScreen = this.focusUnits?.length === 1;
			return maxSubstring(unit.getLogs() ?? `No logs for unit ${unit.config.label}`, isFullScreen ? MB : 100 * KB, 'end');
		}

		//With running logs, last index should return the running logs
		if (widgetIndex === this.focusUnits.length)
			return maxSubstring(this.getLogs(), 100 * KB, 'end');

		const unit = this.focusUnits[widgetIndex];
		return maxSubstring(unit.getLogs() ?? `No logs for unit ${unit.config.label}`, 100 * KB, 'end');
	};

	private renderGridWidgets = () => {
		this.gridCellWidgets.forEach((widget, index) => {
			const scrollPosition = widget.getScroll();
			const content = this.getContentForWidget(index);
			widget.setContent(content);
			widget.setScroll(scrollPosition);
			widget.setLabel(this.getGridWidgetLabel(index));
		});
	};

	//######################### Options #########################

	public setWithRunningLogs = (val: boolean) => this.withRunningLogs = val;
}