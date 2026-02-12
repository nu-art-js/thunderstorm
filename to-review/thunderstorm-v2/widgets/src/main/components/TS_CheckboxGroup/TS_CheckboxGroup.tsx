import {ComponentSync} from '../../core/ComponentSync.js';
import {_className} from '@nu-art/web-client';
import './TS_CheckboxGroup.scss';
import {TS_Checkbox} from '../TS_Checkbox/index.js';
import {LL_V_L} from '../Layouts/index.js';
import {BadImplementationException} from '@nu-art/ts-common';

type CheckboxOption = {
	id: string;
	label: string;
	disabled?: boolean;
};
export type Props_CheckboxGroup = {
	parent: CheckboxOption;
	options: CheckboxOption[];
	selectedIds: string[];
	onChange: (selectedIds: string[]) => void;
	id?: string;
	className?: string;
};
type State_CheckboxGroup = {
	selectedIds: string[];
	parent: CheckboxOption;
	options: CheckboxOption[];
	allSelected: boolean;
	someSelected: boolean;
	className?: string;
};

/**
 * Checkbox Group Component
 * Handles grouped selection logic for checkboxes.
 */
export class TS_CheckboxGroup
	extends ComponentSync<Props_CheckboxGroup, State_CheckboxGroup> {
	constructor(p: Props_CheckboxGroup) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_CheckboxGroup, state: State_CheckboxGroup) {
		state.selectedIds = nextProps.selectedIds;
		state.options = nextProps.options;
		if (!state.options.length)
			throw new BadImplementationException('cannot have checkbox group without options');
		state.allSelected = (state.selectedIds.length === state.options.length);
		state.someSelected = !state.allSelected && state.selectedIds.length > 0;
		state.parent = nextProps.parent;
		state.className = nextProps.className;
		return state;
	}

	private onClickFather = () => {
		const {options, allSelected, selectedIds} = this.state;
		const selectableOptions = options.filter(option => !option.disabled);
		const newSelectedIds = allSelected || selectableOptions.length === selectedIds.length
			? new Set<string>()
			: new Set(selectableOptions.map(option => option.id));
		this.props.onChange([...newSelectedIds]);
	};
	private onClickCheckbox = (id: string) => {
		const newSelectedIds = new Set(this.state.selectedIds);
		if (newSelectedIds.has(id))
			newSelectedIds.delete(id);
		else
			newSelectedIds.add(id);
		this.props.onChange([...newSelectedIds]);
	};

	render() {
		const {selectedIds, someSelected, allSelected, options, parent, className} = this.state;
		return (<LL_V_L className={_className('ts-checkbox-group', className)} id={this.props.id}>
			<TS_Checkbox checked={allSelected} className={_className('ts-checkbox-group__parent', someSelected && 'ts-checkbox-group__partial')}
									 disabled={parent.disabled} onCheck={this.onClickFather}>
				{parent.label}
			</TS_Checkbox>
			<LL_V_L className={'ts-checkbox-group__children'}>
				{options.map(option => (<TS_Checkbox key={option.id} checked={selectedIds.includes(option.id)} disabled={option.disabled || parent.disabled}
																						 onCheck={() => this.onClickCheckbox(option.id)}>
					{option.label}
				</TS_Checkbox>))}
			</LL_V_L>
		</LL_V_L>);
	}
}
