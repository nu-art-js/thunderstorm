import * as React from 'react';
import {useEffect, useState} from 'react';
import {_className} from '@nu-art/thunder-core';
import './TS_ColorSwatch.scss';

const hexPattern = /^#[0-9a-fA-F]{6}$/;

export type Props_ColorSwatch = {
	value: string;
	onChange: (color: string) => void;
	className?: string;
	disabled?: boolean;
	showHex?: boolean;
};

export function TS_ColorSwatch(props: Props_ColorSwatch) {
	const {value, onChange, className, disabled, showHex} = props;
	// Local draft so partial keystrokes (e.g. "#5b64") stay visible — commit upstream only on a full hex.
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);

	const circle = <label className={_className('ts-color-swatch__circle', disabled && 'disabled')} style={{backgroundColor: value}}>
		<input
			type={'color'}
			className={'ts-color-swatch__picker'}
			value={value}
			disabled={disabled}
			onClick={e => e.stopPropagation()}
			onChange={e => onChange(e.target.value)}
		/>
	</label>;

	if (!showHex)
		return circle;

	const onHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		const hex = raw.startsWith('#') ? raw : `#${raw}`;
		setDraft(hex);
		if (hexPattern.test(hex))
			onChange(hex);
	};

	const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = e.clipboardData.getData('text').trim();
		const hex = pasted.startsWith('#') ? pasted : `#${pasted}`;
		if (hexPattern.test(hex)) {
			e.preventDefault();
			setDraft(hex);
			onChange(hex);
		}
	};

	return <span className={_className('ts-color-swatch', className)}>
		{circle}
		<input
			className={'ts-color-swatch__hex'}
			type={'text'}
			value={draft}
			disabled={disabled}
			maxLength={7}
			onClick={e => e.stopPropagation()}
			onChange={onHexChange}
			onPaste={onPaste}
		/>
	</span>;
}
