import * as React from 'react';
import {
	DBProto,
	sortArray
} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../../../../modules/db-api-gen/ModuleFE_BaseApi';
import {_className} from '../../../../utils/tools';
import './ItemEditor_DefaultList.scss';
import {
	ItemEditor_CustomSort,
	ItemEditor_FilterType
} from '../../types';
import {ComponentSync} from '../../../../core/ComponentSync';
import {ApiCallerEventType} from '../../../../core/db-api-gen/types';
import {MenuAction} from '../../Page_ItemsEditor';
import {
	Model_PopUp,
	ModuleFE_MouseInteractivity,
	mouseInteractivity_PopUp
} from '../../../../component-modules/mouse-interactivity';
import {TS_BusyButton} from '../../../TS_BusyButton';
import {VirtualizedList} from '../../../TS_VirtualizedList';
import {
	InferProps,
	InferState
} from '../../../../utils/types';


export type Props_ListRenderer<Proto extends DBProto<any>> = {
	module: ModuleFE_BaseApi<Proto>,
	selected?: Partial<Proto['uiType']>
	filter: ItemEditor_FilterType<Proto>,
	onSelected: (item: Proto['uiType']) => void
	sort: ItemEditor_CustomSort<Proto>,
	itemRenderer: (item: Proto['uiType']) => JSX.Element,
	contextMenuItems: MenuAction<Proto>[]
};
type State = {}

export class ItemEditor_DefaultList<Proto extends DBProto<any>>
	extends ComponentSync<Props_ListRenderer<Proto>, State> {

	private listContainerRef?: HTMLDivElement;

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		if (nextProps === this.props || nextProps.module !== this.props.module) {
			// @ts-ignore
			delete this[this.props.module.defaultDispatcher.method];
			// @ts-ignore
			this[nextProps.module.defaultDispatcher.method] = (...args: any[]) => this.__onItemUpdated(...args);
		}

		state = super.deriveStateFromProps(nextProps, state) as InferState<this>;
		return state;
	}

	shouldComponentUpdate(): boolean {
		return true;
	}

	private __onItemUpdated = (...params: ApiCallerEventType<Proto>): void => {
		return this.forceUpdate();
	};

	private openItemMenu = (e: React.MouseEvent<HTMLDivElement>, item: Proto['dbType']) => {
		const menuActions = this.props.contextMenuItems;
		if (!menuActions?.length)
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
		const filteredItems = this.props.module.cache.filter(this.props.filter ?? (() => true));
		const sort = this.props.sort || ((items) => sortArray(items, i => i.__createdAt));
		const items = sort(filteredItems);

		const itemsToRender = items.map(item => {
			return <div
				key={item._id}
				onContextMenu={(e) => this.openItemMenu(e, item)}
				className={_className('match_parent', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')}
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
			</div>;
		});

		return <div className={'items-list match_height'} ref={(instance: HTMLDivElement) => {
			if (this.listContainerRef)
				return;

			this.listContainerRef = instance;
			this.forceUpdate();
		}}>
			<VirtualizedList
				className={'match_parent'}
				listToRender={itemsToRender}
				itemHeight={50}
				height={this.listContainerRef?.clientHeight ?? 0}
			/>
		</div>;
	}
}
