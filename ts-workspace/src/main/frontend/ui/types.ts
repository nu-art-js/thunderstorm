import * as React from 'react';
import {DB_Object, TypedMap} from '@nu-art/ts-common';
import {BaseAsyncState} from '@nu-art/thunderstorm/frontend';


export type Props_ConfigChanged = { onConfigChanged: () => void };
export type Props_WorkspacePanel<Config, Props = {}> = Props & Props_ConfigChanged & {
	config: Config
	renderers: TypedMap<React.ElementType>
}

export type State_WorkspacePanel<Config, State = {}> = BaseAsyncState & State & {
	config: Config
}

export type Config_PanelParent<ChildConfig = {}> = ChildConfig & {
	panels: PanelConfig[]
}

export type State_WorkspaceParentPanel<Config, State = {}> = State_WorkspacePanel<Config_PanelParent<Config>, State>
export type Props_WorkspaceParentPanel<Config, Props = {}> = Props_WorkspacePanel<Config_PanelParent<Config>, Props>

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
