import {WorkHubTab} from '@nu-art/work-hub-shared';
import {FC} from 'react';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import './Component_WorkHub_TabContent.scss';

type Props = {
	tab: WorkHubTab;
}

export const Component_WorkHub_TabContent: FC<Props> = (props) => {
	const item = ModuleFE_WorkHub.workHubItem.getByKey(props.tab.itemKey);
	return <div className={'c__work-hub-tab-content'}>
		{item.renderer(props.tab.renderArgs)}
	</div>;
};