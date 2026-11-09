import * as React from 'react';
import {_className} from '@nu-art/thunder-core';

type Props = {
	leading?: React.ReactNode;
	trailing?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	error?: boolean;
	children: React.ReactElement;
};

/** Bare input when there is no slot. The field owns the chrome when a slot is set. */
export function TS_InputField(props: Props) {
	if (!props.leading && !props.trailing)
		return props.children;
	return <label className={_className('ts-input-field', props.disabled && 'disabled', props.error && 'error', props.className)}>
		{props.leading}
		{props.children}
		{props.trailing}
	</label>;
}
