/*
 * Reusable single-scope editor row: key label + TS_DropDown for value selection.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Filter} from '@nu-art/ts-common';
import {LL_H_C, SimpleListAdapter, TS_DropDown} from '@nu-art/thunder-widgets';
import './Component_ScopeEditor.scss';


export type Props_ScopeEditor = {
	scopeKey: string;
	values: string[];
	selected?: string;
	onChanged: (scopeKey: string, value: string) => void;
	disabled?: boolean;
};

const scopeValueFilter = new Filter<string>(item => [item]);

export const Component_ScopeEditor = (props: Props_ScopeEditor) => {
	const {scopeKey, values, selected, onChanged, disabled} = props;

	return <LL_H_C className={'scope-editor__row'}>
		<span className={'scope-editor__key'}>{scopeKey}</span>
		<TS_DropDown<string>
			className={'scope-editor__dropdown'}
			adapter={SimpleListAdapter(values, node => <>{node.item}</>)}
			filter={scopeValueFilter}
			placeholder={'None'}
			selected={selected}
			onSelected={value => onChanged(scopeKey, value)}
			canUnselect={true}
			unselectLabel={'None'}
			disabled={disabled}
		/>
	</LL_H_C>;
};
