import {WorkHubTab} from '@nu-art/work-hub-shared';
import {createRef, FC, useEffect} from 'react';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import './Component_WorkHub_TabContent.scss';
import {AwaitModules, TS_ErrorBoundary} from "@nu-art/thunder-routing";

type Props = {
	tab: WorkHubTab;
}

export const Component_WorkHub_TabContent: FC<Props> = (props) => {
	const item = ModuleFE_WorkHub.workHubItem.getByKey(props.tab.itemKey);
	const ref = createRef<HTMLDivElement>();
	useEffect(() => {
		ref.current?.focus();
	});
	if (item.modulesToAwait?.length)
		return <div className={'c__work-hub-tab-content'} ref={ref} tabIndex={0}>
			<AwaitModules modules={item.modulesToAwait}>
				<TS_ErrorBoundary>
					{item.renderer(item, props.tab.id, props.tab.renderArgs)}
				</TS_ErrorBoundary>
			</AwaitModules>
		</div>;

	return <div className={'c__work-hub-tab-content'} ref={ref} tabIndex={0}>
		<TS_ErrorBoundary>
			{item.renderer(item, props.tab.id, props.tab.renderArgs)}
		</TS_ErrorBoundary>
	</div>;
};