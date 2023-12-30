import * as React from 'react';
import {__stringify, DBProto} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseApi} from '../../../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {LL_V_L} from '../../../Layouts';
import {_className} from '../../../../utils/tools';
import './ItemEditor_DefaultList.scss';
import {ItemEditor_FilterType, ItemEditor_SortType} from '../../types';
import {ComponentSync} from '../../../../core/ComponentSync';
import {ApiCallerEventTypeV3} from '../../../../core/db-api-gen/v3_types';


export type Props_ListRendererV3<Proto extends DBProto<any>> = {
	module: ModuleFE_v3_BaseApi<Proto>,
	selected?: Partial<Proto['uiType']>
	filter: ItemEditor_FilterType<Proto>,
	onSelected: (item: Proto['uiType']) => void
	sort: ItemEditor_SortType<Proto>,
	itemRenderer: (item: Proto['uiType']) => JSX.Element,
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

	render() {
		const sortedItems = this.props.module.cache.sort(this.props.sort);
		const items = sortedItems.filter(this.props.filter);

		return <LL_V_L className="items-list match_height margin__inline">
			<LL_V_L className="flex__grow scrollable-y match_width">
				{items.map(item =>
					<div key={item._id}
							 className={_className('match_width', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')}
							 onClick={(e) => {
								 if (e.metaKey) {
									 if (e.shiftKey)
										 this.logInfo(`item id: ${__stringify(item)}`);
									 else
										 this.logInfo(`item id: ${item.id}`);

									 return;
								 }

								 this.props.onSelected(item);
							 }}>
						{this.props.itemRenderer(item)}</div>)}
			</LL_V_L>
		</LL_V_L>;
	}
}
