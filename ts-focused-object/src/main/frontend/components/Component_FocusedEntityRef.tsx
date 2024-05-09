import * as React from 'react';
import {ComponentSync, LL_H_C, Show} from '@nu-art/thunderstorm/frontend';
import {FocusData_Map, FocusedEntity} from '../../shared';
import {filterDuplicates, UniqueId} from '@nu-art/ts-common';
import {ModuleFE_FocusedObject, OnFocusedDataReceived} from '../modules/ModuleFE_FocusedObject';
import {Component_AccountThumbnail, ModuleFE_Account} from '@nu-art/user-account/frontend';
import './Component_FocusedEntityRef.scss';

type Props = {
	focusedEntities?: FocusedEntity[];
};

type State = {
	accountIds: UniqueId[];
};

export class Component_FocusedEntityRef
	extends ComponentSync<Props, State>
	implements OnFocusedDataReceived {

	// ######################## Lifecycle ########################

	__onFocusedDataReceived(map: FocusData_Map) {
		this.reDeriveState();
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.accountIds = nextProps.focusedEntities?.reduce((accountIds, focusedEntity) => {
			const accountIdsForFocusedItem = ModuleFE_FocusedObject.getAccountIdsForFocusedItem(focusedEntity.dbKey, focusedEntity.itemId);
			return filterDuplicates([...accountIds, ...accountIdsForFocusedItem]);
		}, [] as UniqueId[]) || [];
		return state;
	}

	componentDidMount() {
		if (this.props.focusedEntities)
			ModuleFE_FocusedObject.focus(this.props.focusedEntities);
	}

	componentWillUnmount() {
		if (this.props.focusedEntities)
			ModuleFE_FocusedObject.unfocus(this.props.focusedEntities);
	}

	// ######################## Render ########################

	render() {
		return <LL_H_C className={'component--focused-object'}>
			{this.state.accountIds.map(id => {
				const account = ModuleFE_Account.cache.unique(id);
				return <Show key={id}>
					<Show.If condition={!!account}>
						<Component_AccountThumbnail accountId={id}/>
					</Show.If>
					<Show.Else>
						<div>Bug</div>
					</Show.Else>
				</Show>;
			})}
		</LL_H_C>;
	}
}