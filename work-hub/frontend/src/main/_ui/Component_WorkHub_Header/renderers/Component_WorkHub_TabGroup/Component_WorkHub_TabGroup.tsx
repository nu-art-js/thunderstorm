import {LL_H_C, TS_CollapsableContainer} from '@nu-art/thunder-widgets';
import {WorkHubTabGroup} from '@nu-art/work-hub-shared';
import {CSSProperties, FC} from 'react';
import {Component_WorkHub_Tab} from '../Component_WorkHub_Tab/Component_WorkHub_Tab.js';
import './Component_WorkHub_TabGroup.scss';
import {Component_WorkHub_TabGroupMenu} from '../Component_WorkHub_TabGroupMenu/Component_WorkHub_TabGroupMenu.js';
import {ModuleFE_WorkHub} from '../../../../_module/ModuleFE_WorkHub/ModuleFE_WorkHub.js';

type Props = {
	group: WorkHubTabGroup;
	selectedTabId?: string;
};

export const Component_WorkHub_TabGroup: FC<Props> = (props) => {
	const style = {'--color-fg': props.group.color.foreground, '--color-bg': props.group.color.background} as CSSProperties;
	return <TS_CollapsableContainer
		className={'c__work-hub-tab-group'}
		style={style}
		animated
		forceUpdate
		onCollapseToggle={() => {
			ModuleFE_WorkHub.group.update(props.group.groupKey, {collapsed: !props.group.collapsed});
		}}
		collapsed={props.group.collapsed}
		headerRenderer={() => props.group.label}
		onHeaderRightClick={e => Component_WorkHub_TabGroupMenu.show(e, props.group.groupKey)}
		containerRenderer={() => <LL_H_C>{props.group.tabs.map(tab => <Component_WorkHub_Tab key={tab.id} tab={tab}
																																												 selected={tab.id === props.selectedTabId}/>)}</LL_H_C>}
	/>;
};