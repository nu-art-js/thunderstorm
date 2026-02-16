import * as React from 'react';
import {TS_Slider as TS_SliderV1} from '../v1/index.js';

type Props = {
	min: number;
	max: number;
	value?: number;
	startValue?: number;
	onValueChanged?: (value: number) => void | Promise<void>;
	onValueSet?: (value: number) => void | Promise<void>;
	disabled?: boolean;
	className?: string;
};

export function TS_Slider(props: Props): React.ReactElement {
	return <TS_SliderV1 {...props}/>;
}
