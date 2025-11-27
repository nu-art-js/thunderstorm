import {WorkHubTab} from '@nu-art/work-hub-shared';
import {FC} from 'react';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import './Component_WorkHub_TabContent.scss';
import {AwaitModules} from '@nu-art/thunderstorm-frontend';

type Props = {
	tab: WorkHubTab;
}

export const Component_WorkHub_TabContent: FC<Props> = (props) => {
	const item = ModuleFE_WorkHub.workHubItem.getByKey(props.tab.itemKey);
	if (item.modulesToAwait?.length)
		return <div className={'c__work-hub-tab-content'}>
			<AwaitModules modules={item.modulesToAwait}>
				{item.renderer(props.tab.renderArgs)}
			</AwaitModules>
		</div>;

	return <div className={'c__work-hub-tab-content'}>
		{item.renderer(props.tab.renderArgs)}
	</div>;
};