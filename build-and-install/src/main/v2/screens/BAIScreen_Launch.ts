import {BAIScreen} from './BAIScreen';
import {BaseUnit} from '../unit/core';
import {MemKey_PhaseRunner} from '../phase-runner/consts';
import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../unit/firebase-units';
import {Widgets} from 'blessed';
import {PhaseRunner_OnUnitsChange} from '../phase-runner/PhaseRunnerDispatcher';

type GridCell = { width: number; height: number };
type GridCol = GridCell[];
type GridDimensions = GridCol[];

export class BAIScreen_Launch
	extends BAIScreen
	implements PhaseRunner_OnUnitsChange {

	//######################### Properties #########################

	private units: BaseUnit[] = [];
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
		this.createGridWidgets();
		this.renderGridWidgets();
		this.container.screen.render();
	};

	protected onLogUpdated = () => {
		this.renderGridWidgets();
	};

	private updateUnits = () => {
		const runner = MemKey_PhaseRunner.get();
		this.units = runner.getUnits().filter(unit => {
			return unit.isInstanceOf(Unit_FirebaseHostingApp) || unit.isInstanceOf(Unit_FirebaseFunctionsApp);
		});
	};

	//######################### Content Creation #########################

	protected createContent(): void {
		this.updateUnits();
		this.createGridWidgets();
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
						border: {fg: 'blue'},
					},
					valign: 'top',
					align: 'left',
					mouse: true,
				};
				this.gridCellWidgets.push(this.createWidget('log', props));
				yPos += height; //Assuming all cells in a column have the same height
				widgetIndex++;
			});
			xPos += col[0].width * 100; //Assuming all Cells have the same width
		});
	};

	private calculateGridDimensions = () => {
		let n = this.units.length;
		//Add 1 more window for running logs
		if (this.withRunningLogs)
			n++;

		const grid: GridDimensions = [];
		const columns = Math.ceil(Math.sqrt(n)); // Calculate number of columns

		let remainingItems = n;
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

	private getGridWidgetLabel = (index: number) => {
		if (!this.withRunningLogs)
			return this.units[index].config.label;

		return index === this.units.length ? 'Running Logs' : this.units[index].config.label;
	};

	//######################### Content Destruction #########################

	protected destroyContent() {
		this.destroyGridWidgets();
	}

	private destroyGridWidgets = () => {
		this.gridCellWidgets.forEach(widget => widget.destroy());
	}

	//######################### Render #########################

	protected render(): void {
		this.renderGridWidgets();
		this.logInfo('GRID DIMENSIONS', this.gridDimensions);
		this.logInfo('UNITS', this.units.map(unit => unit.config.label));
		this.logInfo('RUNNER UNITS', MemKey_PhaseRunner.get().getUnits().map(unit => unit.config.label));
	}

	private getContentForWidget = (widgetIndex: number) => {
		if (!this.withRunningLogs) {
			const unit = this.units[widgetIndex];
			return unit.getLogs() ?? `No logs for unit ${unit.config.label}`;
		}

		//With running logs, last index should return the running logs
		if (widgetIndex === this.units.length)
			return this.getLogs();

		const unit = this.units[widgetIndex];
		return unit.getLogs() ?? `No logs for unit ${unit.config.label}`;
	};

	private renderGridWidgets = () => {
		this.gridCellWidgets.forEach((widget, index) => {
			const scrollPosition = widget.getScroll();
			const content = this.getContentForWidget(index);
			widget.setContent(content);
			widget.setScroll(scrollPosition);
		});
	};

	//######################### Options #########################

	public setWithRunningLogs = (val: boolean) => this.withRunningLogs = val;
}