/*
 * Thunderstorm is a full web app framework!
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import * as React from 'react';
import {useCallback, useId, useMemo} from 'react';
import {exists, resolveContent} from '@nu-art/ts-common';
import {_className} from '@nu-art/thunder-core';
import '../v2/TS_CheckboxV2.scss';
import {TS_Icons} from '@nu-art/ts-styles';
import type {IconSpec_TS_CheckboxV2, Props_TS_CheckboxV2} from '../v2/TS_CheckboxV2.js';

export type {IconSpec_TS_CheckboxV2, Props_TS_CheckboxV2} from '../v2/TS_CheckboxV2.js';

const defaultIconSpec: IconSpec_TS_CheckboxV2 = {
	checked: () => <TS_Icons.v.component/>,
	unChecked: () => <TS_Icons.x.component/>,
	indeterminate: () => <TS_Icons.dash.component/>,
};

/**
 * Function component implementation of TS_CheckboxV2 — same API surface.
 */
export function TS_CheckboxV3(props: Props_TS_CheckboxV2) {
	const {
					checked,
					onCheck,
					label,
					disabled = false,
					className,
					id: idProp,
					customIcons
				} = props;
	const id = useId();
	const resolvedId = idProp ?? id;
	const spec = customIcons ?? defaultIconSpec;
	const iconNode = useMemo(() => {
		return exists(checked)
			? (checked ? spec.checked : spec.unChecked)
			: spec.indeterminate;
	}, [checked, spec]);
	const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		onCheck(e.target.checked);
	}, [onCheck]);
	const ariaChecked = exists(checked) ? (checked ? 'true' : 'false') : 'mixed';
	return (
		<label className={_className('ts-checkbox-v2', className)} onClick={e => e.stopPropagation()}>
			<input
				type="checkbox"
				id={resolvedId}
				disabled={disabled}
				onChange={onChange}
				checked={!!checked}
				aria-checked={ariaChecked}
			/>
			<span className="ts-checkbox-v2__icon">{resolveContent(iconNode)}</span>
			<span className="ts-checkbox-v2__label">{label}</span>
		</label>
	);
}
