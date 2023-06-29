import * as React from 'react';


export type AppToolsScreen = {
	key?: string;
	name: string;
	renderer: React.ComponentType;
	icon?: React.ComponentType; //Icon for rendering in the navigator
	group?: string; //For grouping in the navigator
}