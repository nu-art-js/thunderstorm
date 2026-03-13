import * as React from 'react';
import {sortArray} from '@nu-art/ts-common';
import {_className} from '@nu-art/thunder-core';
import {Button, ComponentSync, InferProps, InferState, VirtualizedList} from '@nu-art/thunder-widgets';
import './ItemEditor_DefaultList.scss';
import type {Props_ListRenderer} from '@nu-art/editable-item';
import {ApiCallerEventType, DB_Prototype} from '@nu-art/db-api-shared';
import {Model_PopUp, ModuleFE_MouseInteractivity, mouseInteractivity_PopUp} from '@nu-art/thunder-mouse-interactivity-frontend';

type State = {};

export class ItemEditor_DefaultList<Database extends DB_Prototype<any>>
	extends ComponentSync<Props_ListRenderer<Database>, State> {
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

	private __onItemUpdated = (...params: ApiCallerEventType<Database['dbType']>): void => {
		return this.forceUpdate();
	};
	private openItemMenu = (e: React.MouseEvent<HTMLDivElement>, item: Database['dbType']) => {
		const menuActions = this.props.contextMenuItems;
		if (!menuActions?.length)
			return;
		const model: Model_PopUp = {
			id: 'permission-editor-item-menu',
			originPos: {x: e.clientX, y: e.clientY},
			modalPos: {x: 1, y: 1},
			content: () => <>
				{menuActions.map((action, index) => {
					return <Button key={index} onClick={async () => {
						const shouldClose = await action.action(item as any) ?? false;
						if (shouldClose)
							ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
					}}>{action.label}</Button>;
				})}
			</>
		};
		ModuleFE_MouseInteractivity.showContent(model);
	};

	render() {
		const filteredItems = this.props.module.cache.filter(this.props.filter ?? (() => true));
		const sort = this.props.sort || ((items: Database['uiType'][]) => sortArray(items, (i: Database['uiType']) => (i as { __createdAt?: number }).__createdAt));
		const items = sort(filteredItems);
		const itemsToRender = items.map(item => {
			return <div key={item._id} onContextMenu={(e) => this.openItemMenu(e, item)}
									className={_className('match_parent', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')} onClick={(e) => {
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
			<VirtualizedList className={'match_parent'} listToRender={itemsToRender} itemHeight={50} height={this.listContainerRef?.clientHeight ?? 0}/>
		</div>;
	}
}
