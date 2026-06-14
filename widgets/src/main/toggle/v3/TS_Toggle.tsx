import * as React from 'react';
import {_className} from '@nu-art/thunder-core';
import '../TS_Toggle.scss';

export type Props_TS_Toggle = {
	id?: string;
	checked: boolean;
	onCheck: (status: boolean) => void;
	disabled?: boolean;
	containerClassName?: string;
	sliderClassName?: string;
};

export function TS_Toggle(props: Props_TS_Toggle): React.ReactElement {
	const generatedId = React.useId();
	const id = props.id ?? generatedId;
	const containerClassName = _className('ts-toggle', props.disabled && 'disabled', props.containerClassName);
	const sliderClassName = _className('ts-toggle__slider', props.disabled && 'disabled', props.sliderClassName);

	return (
		<label className={containerClassName}>
			<input
				id={id}
				type="checkbox"
				className="ts-toggle__checkbox"
				checked={props.checked}
				disabled={props.disabled}
				onChange={e => props.onCheck(e.target.checked)}
			/>
			<span className={sliderClassName} aria-hidden="true"/>
		</label>
	);
}
