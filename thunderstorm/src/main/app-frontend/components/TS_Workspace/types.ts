import * as React from 'react';
import {DB_Object, TypedMap} from '@nu-art/ts-common';

export type Props_ConfigChanged = { onConfigChanged: () => void };
export type Props_BasePanel<Config> = Props_ConfigChanged & {
	config: Config
	renderers: TypedMap<React.ElementType>
}

export type Props_PanelParent = {
	panels: PanelConfig[]
}

export type Props_OrientedWorkspace = {
	firstEdge: 'top' | 'left';
	secondEdge: 'bottom' | 'right';
	orientation: 'horizontal' | 'vertical';
	dimensionProp: 'height' | 'width';
	dimensionClientProp: 'clientHeight' | 'clientWidth';
	mousePos: 'pageY' | 'pageX';
}

export type PanelsData = {
	horizontalSpace: { panels: PanelConfig<any, any>[] }
	verticalSpace: { panels: PanelConfig<any, any>[] }
	topPanel: never
	leftPanel: never
	centerPanel: never
	rightPanel: never
	bottomPanel: never
}
// type DataResolver<DataType> = (DataType extends never ? { data?: DataType } : { data: DataType })

export type PanelConfig<PanelType extends keyof PanelsData = keyof PanelsData, PanelData extends PanelsData[PanelType] = PanelsData[PanelType]> = {
	// config of the panel wrapper / viewport
	name: string
	visible: boolean
	factor: number
	min: number

	// config of the panel content
	key: PanelType
} & { data?: PanelData }

export type  WorkspaceConfig = DB_Object & PanelConfig;
