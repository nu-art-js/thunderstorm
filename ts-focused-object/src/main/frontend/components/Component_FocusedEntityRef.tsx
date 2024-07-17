import * as React from 'react';
import {ComponentSync, LL_H_C, Show} from '@nu-art/thunderstorm/frontend';
import {FocusData_Map, FocusedEntity} from '../../shared';
import {compare, filterDuplicates, UniqueId} from '@nu-art/ts-common';
import {ModuleFE_FocusedObject, OnFocusedDataReceived} from '../modules/ModuleFE_FocusedObject';
import {Component_AccountThumbnail, ModuleFE_Account} from '@nu-art/user-account/frontend';
import './Component_FocusedEntityRef.scss';

type Props = {
	focusedEntities?: FocusedEntity[];
	ignoreCurrentUser?: boolean;
};

type State = {
	focusedEntities?: FocusedEntity[];
	ignoreCurrentUser?: boolean;
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
		state.focusedEntities = nextProps.focusedEntities;
		state.ignoreCurrentUser = nextProps.ignoreCurrentUser;
		state.accountIds = state.focusedEntities?.reduce((accountIds, focusedEntity) => {
			const accountIdsForFocusedItem = ModuleFE_FocusedObject.getAccountIdsForFocusedItem(focusedEntity.dbKey, focusedEntity.itemId, state.ignoreCurrentUser);
			return filterDuplicates([...accountIds, ...accountIdsForFocusedItem]);
		}, [] as UniqueId[]) || [];
		return state;
	}

	/**
	 * Mount / Unmount logic handled in
	 * - ComponentWillUnmount
	 * - ComponentDidMount
	 * - ComponentDidUpdate
	 *
	 * It must be the case, in order for un-focusing and focusing to happen in the correct order
	 * no matter how the component is rendered or recycled.
	 */


	componentWillUnmount() {
		if (this.state.focusedEntities)
			ModuleFE_FocusedObject.unfocus(this.state.focusedEntities);
	}

	componentDidMount() {
		//If mounted with focus entities, focus on them
		if (this.state.focusedEntities)
			ModuleFE_FocusedObject.focus(this.state.focusedEntities);
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
		//Change in focused entities, set new focused
		if (!compare(prevState.focusedEntities, this.state.focusedEntities)) {
			//Unfocus previous entities
			if (this.state.focusedEntities)
				ModuleFE_FocusedObject.unfocus(this.state.focusedEntities);

			//focus current entities
			if (prevState.focusedEntities)
				ModuleFE_FocusedObject.focus(prevState.focusedEntities);
		}
	}

	// ######################## Render ########################

	render() {
		return <LL_H_C className={'component--focused-object'}>
			{this.state.accountIds.map(id => {
				const account = ModuleFE_Account.cache.unique(id);
				return <Show key={id}>
					<Show.If condition={!!account}>
						<Component_AccountThumbnail accountId={() => id}/>
					</Show.If>
					<Show.Else>
						<div>Bug</div>
					</Show.Else>
				</Show>;
			})}
		</LL_H_C>;
	}
}