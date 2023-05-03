import * as React from 'react';

export type AppToolsScreenType = 'dev' | 'playground'

export type AppToolsScreen = {
	name: string;
	key: string;
	type: AppToolsScreenType
	renderer: React.ComponentType;
	icon?: React.ComponentType;
}