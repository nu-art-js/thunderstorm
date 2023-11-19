import * as React from 'react';


export type AppToolsScreen = {
	key?: string;
	name: string;
	renderer: React.ComponentType;
	icon?: React.ComponentType; //Icon for rendering in the navigator
	group?: string; //For grouping in the navigator
}

export const ATS_3rd_Party = '3rd Party';
export const ATS_Fullstack = 'Fullstack';
export const ATS_Frontend = 'Frontend';
export const ATS_Backend = 'Backend';
export const ATS_Garbage = 'Garbage';
export const ATS_ToRefactor = 'To Refactor';