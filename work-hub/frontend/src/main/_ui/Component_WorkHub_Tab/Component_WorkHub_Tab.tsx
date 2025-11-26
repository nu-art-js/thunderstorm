import {FC, MouseEvent} from 'react';
import './Component_WorkHub_Tab.scss';
import {_className, LL_H_C} from '@nu-art/thunderstorm-frontend';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import { exists } from '@nu-art/ts-common';

type Props = {
	id: string;
	label: string;
	tag?: string;
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

export const Component_WorkHub_Tab: FC<Props> = (props) => {
	const className = _className('c__work-hub-tab', props.selected && 'selected');
	return <LL_H_C
		className={className}
		onMouseUp={e => onTabMouseDown(e, props.id)}
		onClick={e => onTabClick(e, props.id)}
	>
		{ exists(props.tag) && <div className={'c__work-hub-tab__tag'}>{props.tag}</div>}
		{props.label}
	</LL_H_C>;
};