import * as React from 'react';
import {DBProto} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseApi} from '../../../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {LL_V_L} from '../../../Layouts';
import {_className} from '../../../../utils/tools';
import './ItemEditor_DefaultList.scss';
import {ItemEditor_FilterType, ItemEditor_SortType} from '../../types';
import {ComponentSync} from '../../../../core/ComponentSync';
import {ApiCallerEventTypeV3} from '../../../../core/db-api-gen/v3_types';
import {MenuAction} from '../../Page_ItemsEditorV3';
import {
	Model_PopUp,
	ModuleFE_MouseInteractivity,
	mouseInteractivity_PopUp
} from '../../../../component-modules/mouse-interactivity';
import {TS_BusyButton} from '../../../TS_BusyButton';


export type Props_ListRendererV3<Proto extends DBProto<any>> = {
	module: ModuleFE_v3_BaseApi<Proto>,
	selected?: Partial<Proto['uiType']>
	filter: ItemEditor_FilterType<Proto>,
	onSelected: (item: Proto['uiType']) => void
	sort: ItemEditor_SortType<Proto>,
	itemRenderer: (item: Proto['uiType']) => JSX.Element,
	contextMenuItems: MenuAction<Proto>[]
};

export class ItemEditor_DefaultList<Proto extends DBProto<any>>
	extends ComponentSync<Props_ListRendererV3<Proto>> {

	protected deriveStateFromProps(nextProps: Props_ListRendererV3<Proto>, state: Partial<any>) {
		if (nextProps === this.props || nextProps.module !== this.props.module) {
			// @ts-ignore
			delete this[this.props.module.defaultDispatcher.method];
			// @ts-ignore
			this[nextProps.module.defaultDispatcher.method] = (...args: any[]) => this.__onItemUpdated(...args);
		}

		return state;
	}

	shouldComponentUpdate(): boolean {
		return true;
	}

	private __onItemUpdated = (...params: ApiCallerEventTypeV3<Proto>): void => {
		return this.forceUpdate();
	};

	private openItemMenu = (e: React.MouseEvent<HTMLDivElement>, item: Proto['dbType']) => {
		const menuActions = this.props.contextMenuItems;
		if (!menuActions.length)
			return;

		const model: Model_PopUp = {
			id: 'permission-editor-item-menu',
			originPos: {x: e.clientX, y: e.clientY},
			modalPos: {x: 1, y: 1},
			content: () => <>
				{menuActions.map((action, index) => {
					return <TS_BusyButton
						key={index}
						onClick={async () => {
							const shouldClose = await action.action(item) ?? false;
							if (shouldClose)
								ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
						}}>{action.label}</TS_BusyButton>;
				})}
			</>
		};
		ModuleFE_MouseInteractivity.showContent(model);
	};

	render() {
		const sortedItems = this.props.module.cache.sort(this.props.sort);
		const predicate = this.props.filter ?? (() => true);
		const items = sortedItems.filter(predicate);

		return <LL_V_L className="items-list match_height margin__inline">
			{items.map(item =>
				<div key={item._id}
					 onContextMenu={(e) => this.openItemMenu(e, item)}
					 className={_className('match_width', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')}
					 onClick={(e) => {
						 if (e.metaKey) {
							 if (e.shiftKey)
								 this.logInfo(`item: ${item._id}`, item);
							 else
								 this.logInfo(`item: ${item._id}`);
							 return;
						 }

						 this.props.onSelected(item);
					 }}>
					{this.props.itemRenderer(item)}
				</div>)}
		</LL_V_L>;
	}
}
