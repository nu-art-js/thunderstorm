import {FC, MouseEvent} from 'react';
import './Component_WorkHub_Tab.scss';
import {_className, LL_H_C} from '@nu-art/thunderstorm-frontend';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import {exists} from '@nu-art/ts-common';
import {WorkHubTab} from '@nu-art/work-hub-shared';

type Props = {
	tab: WorkHubTab;
	selected: boolean;
}

const onTabMouseDown = (e: MouseEvent<HTMLDivElement>, tabId: string) => {
	if (e.button !== 1) //Only take into account middle mouse button
		return;

	e.stopPropagation();
	ModuleFE_WorkHub.tabs.remove(tabId);
};

const onTabClick = (e: MouseEvent<HTMLDivElement>, tabId: string) => {
	e.stopPropagation();
	ModuleFE_WorkHub.tabs.select(tabId);
};

const onTabRightClick = (e: MouseEvent<HTMLDivElement>, tab: WorkHubTab) => {
	const workHubItem = ModuleFE_WorkHub.workHubItem.getByKey(tab.itemKey);
	if(!workHubItem)
		return;

	workHubItem.openTabMenu(e, tab);
};

export const Component_WorkHub_Tab: FC<Props> = (props) => {
	const className = _className('c__work-hub-tab', props.selected && 'selected');
	return <LL_H_C
		className={className}
		onMouseUp={e => onTabMouseDown(e, props.tab.id)}
		onClick={e => onTabClick(e, props.tab.id)}
		onContextMenu={e => onTabRightClick(e, props.tab)}
	>
		{exists(props.tab.tag) && <div className={'c__work-hub-tab__tag'}>{props.tab.tag}</div>}
		{props.tab.label}
	</LL_H_C>;
};