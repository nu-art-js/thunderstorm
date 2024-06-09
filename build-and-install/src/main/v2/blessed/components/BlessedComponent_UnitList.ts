import {BlessedComponent} from './BlessedComponent';
import {BaseUnit} from '../../unit/core';
import {BlessedWidgetOptions} from '../core';
import {PhaseRunner_OnUnitsChange, PhaseRunner_OnUnitStatusChange} from '../../phase-runner/PhaseRunnerDispatcher';
import {Widgets} from 'blessed';
import {BlessedComponent_TextBox} from './BlessedComponent_TextBox';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';

//######################### Unit List #########################

export type UnitList_Props = {
	onUnitSelected?: (unit?: BaseUnit) => void;
	selectedUnitKey?: string;
}

type List_State = {
	units: BaseUnit[]
	selectedUnitKey?: string;
};

export class BlessedComponent_UnitList
	extends BlessedComponent<'list', UnitList_Props, List_State>
	implements PhaseRunner_OnUnitsChange {

	constructor(widgetProps: BlessedWidgetOptions['list'], initialProps?: UnitList_Props) {
		super('list', widgetProps, initialProps);
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

	protected deriveStateFromProps(nextProps: UnitList_Props, state: List_State): List_State {
		console.log('Deriving');
		state.selectedUnitKey = nextProps.selectedUnitKey;
		return state;
	}

	private onUnitSelected = (unit: BaseUnit) => {
		if (!this.props.onUnitSelected)
			return;

		console.log(`state: ${this.state.selectedUnitKey}, selected: ${unit.config.key}`);
		const _unit = this.props.selectedUnitKey === unit.config.key ? undefined : unit;
		return this.props.onUnitSelected(_unit);
	};

	protected createChildren() {
		const units = this.state.units ?? [];
		units.forEach((unit, index) => {
			const props: Widgets.BoxOptions = {
				top: index,
				left: 0,
				width: '100%',
				height: 1,
			};

			//Initial Props - no unit starts selected
			const initialProps = {
				unit: unit,
				selected: false,
				onUnitSelected: this.onUnitSelected,
			} as Unit_Props;

			this.registerChild(new BlessedComponent_Unit(props, initialProps),
				state => {
					const selected = unit.config.key === state.selectedUnitKey;
					return {
						unit: unit,
						selected: selected,
						onUnitSelected: this.onUnitSelected,
					};
				});
		});
	}
}

//######################### Unit Item #########################

type Unit_Props = { unit: BaseUnit; onUnitSelected: (unit: BaseUnit) => void; selected?: boolean };
type Unit_State = { unit: BaseUnit; selected: boolean; status: string };

class BlessedComponent_Unit
	extends BlessedComponent<'box', Unit_Props, Unit_State>
	implements PhaseRunner_OnUnitStatusChange {

	//######################### Lifecycle #########################

	constructor(widgetProps: BlessedWidgetOptions['box'], initialProps: Unit_Props) {
		super('box', widgetProps, initialProps);
	}

	__onUnitStatusChange = (unit: BaseUnit) => {
		if (unit.config.key !== this.state.unit.config.key)
			return;

		this.setState({status: unit.getStatus() ?? 'N/A'});
	};

	protected deriveStateFromProps(nextProps: Unit_Props, state: Unit_State): Unit_State {
		state.unit ??= nextProps.unit;
		state.status = state.unit.getStatus() ?? 'N/A';
		state.selected = nextProps.selected ?? false;
		return state;
	}

	//######################### Logic #########################

	private onClick = () => {
		this.props.onUnitSelected(this.state.unit);
	};

	//######################### Content Creation #########################

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

	protected createWidget() {
		super.createWidget();
		this.widget!.on('mousedown', () => this.onClick());
	}

	//######################### Render #########################

	protected renderSelf() {
		const fg = this.state.selected ? 'white' : 'blue';
		const bg = this.state.selected ? 'blue' : undefined;
		const unitName = this.children[0].component.widget as Widgets.TextElement;
		const unitStatus = this.children[1].component.widget as Widgets.TextElement;
		unitName.style.fg = fg;
		unitName.style.bg = bg;
		unitStatus.style.fg = fg;
		unitStatus.style.bg = bg;
	}
}