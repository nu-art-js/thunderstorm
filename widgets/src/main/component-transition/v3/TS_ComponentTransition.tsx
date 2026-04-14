import * as React from 'react';
import {TS_ComponentTransition as TS_ComponentTransitionV1} from '../v1/index.js';

type Props = React.PropsWithChildren<{
	trigger: boolean;
	mountTimeout?: number;
	unmountTimeout?: number;
	transitionTimeout: number;
	transitionPrefix?: string;
	onEnterDone?: () => void;
	onExitDone?: () => void;
	skipAnimationOnMount?: boolean;
}>;

export function TS_ComponentTransition(props: Props): React.ReactElement {
	return <TS_ComponentTransitionV1 {...props}/>;
}
