import {ReactNode} from 'react';

export type FloatingWindowRect = {
	width?: number;
	height?: number;
	x: number;
	y: number;
};

export type Model_FloatingWindow = {
	key: string;
	content: (closeWindowCB: VoidFunction) => ReactNode;
	rect: FloatingWindowRect;
	resizable?: boolean;
	moveable?: boolean;
	className?: string;
}