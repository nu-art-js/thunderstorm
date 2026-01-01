import {FC} from 'react';
import {LL_H_C} from "@nu-art/thunder-routing";
import {WorkHubTab} from '@nu-art/work-hub-shared';
import './Component_WorkHub_Header.scss';
import {Component_WorkHub_Tab} from '../Component_WorkHub_Tab/Component_WorkHub_Tab.js';

type Props = {
	tabs: WorkHubTab[];
	selectedTabId?: string;
};

export const Component_WorkHub_Header: FC<Props> = (props) => {
	return <LL_H_C className={'c__work-hub-header'}>
		{props.tabs.map(tab => {
			return <Component_WorkHub_Tab
				key={tab.id}
				tab={tab}
				selected={tab.id === props.selectedTabId}
			/>;
		})}
	</LL_H_C>;
};