import {FC} from 'react';
import {LL_H_C} from '@nu-art/thunder-widgets';
import {isWorkHubTabGroup, WorkHubTab, WorkHubTabGroup} from '@nu-art/work-hub-shared';
import './Component_WorkHub_Header.scss';
import {Component_WorkHub_Tab} from './renderers/Component_WorkHub_Tab/Component_WorkHub_Tab.js';
import {Component_WorkHub_TabGroup} from './renderers/Component_WorkHub_TabGroup/Component_WorkHub_TabGroup.js';

type Props = {
	items: (WorkHubTabGroup | WorkHubTab)[];
	selectedTabId?: string;
};

export const Component_WorkHub_Header: FC<Props> = (props) => {
	return <LL_H_C className={'c__work-hub-header'}>
		{props.items.map(item => {
			if (isWorkHubTabGroup(item))
				return <Component_WorkHub_TabGroup
					key={item.groupKey}
					group={item}
					selectedTabId={props.selectedTabId}
				/>;

			return <Component_WorkHub_Tab
				key={item.id}
				tab={item}
				selected={item.id === props.selectedTabId}
			/>;
		})}
	</LL_H_C>;
};