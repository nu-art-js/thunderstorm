import * as React from 'react';


export type AppToolsScreen = {
	key?: string;
	name: string;
	renderer: React.ComponentType;
	icon?: React.ComponentType;
}