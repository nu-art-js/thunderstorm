import {BlessedComponent} from './BlessedComponent';
import {BaseUnit} from '../../unit/core';
import {BlessedWidgetOptions} from '../core';
import {PhaseRunner_OnUnitsChange, PhaseRunner_OnUnitStatusChange} from '../../phase-runner/PhaseRunnerDispatcher';
import {Widgets} from 'blessed';
import {BlessedComponent_TextBox} from './BlessedComponent_TextBox';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';

//######################### Unit List #########################

type List_Props = {
	onUnitClicked?: (unit: BaseUnit) => void;
	selectedUnitKey?: string;
}

type List_State = {
	units: BaseUnit[]
	selectedUnitKey?: string;
};

export class BlessedComponent_UnitList
	extends BlessedComponent<'list', List_Props, List_State>
	implements PhaseRunner_OnUnitsChange {

	constructor(widgetProps: BlessedWidgetOptions['list']) {
		super('list', widgetProps);
	}

	__onUnitsChange = (data: BaseUnit[]) => {
		this.destroyChildren();
		this.state.units = data;
		this.createChildren();
	};

	protected getInitialState(): List_State {
		return {
			units: MemKey_PhaseRunner.get().getUnits(),
		};
	}

	protected deriveStateFromProps(nextProps: List_Props, state: List_State): List_State {
		state.selectedUnitKey = nextProps.selectedUnitKey;
		return state;
	}

	protected createChildren() {
		const units = this.state.units ?? [];
		units.forEach((unit, index) => {
			const props: Widgets.BoxOptions = {
				top: index,
				left: 0,
				width: '100%',
				height: 1,
			};

			this.registerChild(new BlessedComponent_Unit(props, unit),
				state => {
					const selected = unit.config.key === state.selectedUnitKey;
					return {unitKey: unit.config.key, selected};
				});
		});
	}
}

//######################### Unit Item #########################

type Unit_Props = { selected?: boolean };
type Unit_State = { unit: BaseUnit; selected: boolean; status: string };

class BlessedComponent_Unit
	extends BlessedComponent<'box', Unit_Props, Unit_State>
	implements PhaseRunner_OnUnitStatusChange {

	constructor(widgetProps: BlessedWidgetOptions['box'], unit: BaseUnit) {
		super('box', widgetProps);
		this.state.unit = unit;
	}

	__onUnitStatusChange = (unit: BaseUnit) => {
		if (unit.config.key !== this.state.unit.config.key)
			return;

		this.setState({status: unit.getStatus() ?? 'N/A'});
	};

	protected deriveStateFromProps(nextProps: Unit_Props, state: Unit_State): Unit_State {
		state.status = state.unit.getStatus() ?? 'N/A';
		state.selected = nextProps.selected ?? false;
		return state;
	}

	protected createChildren(): void {
		this.createUnitName();
		this.createUnitStatus();
	}

	private createUnitName() {
		const props: Widgets.TextOptions = {
			width: '50%',
			height: '100%',
			left: 0,
			align: 'left',
			style: {
				fg: 'blue',
			},
		};
		this.registerChild(
			new BlessedComponent_TextBox(props),
			state => {
				return {text: state.unit.config.label};
			}
		);
	}

	private createUnitStatus() {
		const props: Widgets.TextOptions = {
			width: '50%',
			height: '100%',
			right: 0,
			align: 'right',
			style: {
				fg: 'blue',
			},
		};
		this.registerChild(
			new BlessedComponent_TextBox(props),
			state => ({text: state.status})
		);
	}
}