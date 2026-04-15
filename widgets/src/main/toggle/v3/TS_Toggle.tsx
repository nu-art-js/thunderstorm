import * as React from 'react';
import {TS_Toggle as TS_ToggleV1} from '../v1/TS_Toggle.js';

type Props = {
	id?: string;
	checked: boolean;
	onCheck: (status: boolean) => void;
	disabled?: boolean;
	containerClassName?: string;
	sliderClassName?: string;
};

export function TS_Toggle(props: Props): React.ReactElement {
	return <TS_ToggleV1 {...props}/>;
}
