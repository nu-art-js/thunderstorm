import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import '../TS_CheckboxGroup.scss';
import {TS_Checkbox} from '../../checkbox/v1/index.js';
import {LL_V_L} from '../../layouts/v3/index.js';
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

export function TS_CheckboxGroup(props: Props_CheckboxGroup): React.ReactElement {
	const {parent, options, selectedIds, onChange, id, className} = props;
	if (!options.length)
		throw new BadImplementationException('cannot have checkbox group without options');
	const allSelected = selectedIds.length === options.length;
	const someSelected = !allSelected && selectedIds.length > 0;
	const selectableOptions = options.filter(o => !o.disabled);

	const onClickFather = () => {
		const newSelectedIds = allSelected || selectableOptions.length === selectedIds.length
			? new Set<string>()
			: new Set(selectableOptions.map(o => o.id));
		onChange([...newSelectedIds]);
	};
	const onClickCheckbox = (optionId: string) => {
		const next = new Set(selectedIds);
		if (next.has(optionId))
			next.delete(optionId);
		else
			next.add(optionId);
		onChange([...next]);
	};

	return (
		<LL_V_L className={_className('ts-checkbox-group', className)} id={id}>
			<TS_Checkbox
				checked={allSelected}
				className={_className('ts-checkbox-group__parent', someSelected && 'ts-checkbox-group__partial')}
				disabled={parent.disabled}
				onCheck={onClickFather}
			>
				{parent.label}
			</TS_Checkbox>
			<LL_V_L className="ts-checkbox-group__children">
				{options.map(option => (
					<TS_Checkbox
						key={option.id}
						checked={selectedIds.includes(option.id)}
						disabled={option.disabled || parent.disabled}
						onCheck={() => onClickCheckbox(option.id)}
					>
						{option.label}
					</TS_Checkbox>
				))}
			</LL_V_L>
		</LL_V_L>
	);
}
