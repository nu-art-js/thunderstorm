import {ComponentAsync, LL_H_C} from '@nu-art/thunderstorm/frontend';
import {_keys, TypedMap} from '@nu-art/ts-common';
import * as React from 'react';
import {ModuleFE_FocusedObject, OnFocusedDataReceived} from '../modules/ModuleFE_FocusedObject';
import {FocusData_Map, FocusData_Object} from '../../shared';

type UserFocusData = TypedMap<TypedMap<FocusData_Object>> // dbName:itemId[]

type Props = {
	focusData: TypedMap<string[]> // dbName:itemId[]
}
type State = {
	userFocusMap: TypedMap<UserFocusData> // accountId:dbName:itemId[]
}

export class Component_FocusedEntityRef
	extends ComponentAsync<Props, State>
	implements OnFocusedDataReceived {

	__onFocusedDataReceived(map: FocusData_Map): void {
		const updatedUserFocusMap: TypedMap<UserFocusData> = {};

		const relevantData = this.props.focusData;
		const relevantDBNames: string[] = _keys(relevantData);

		relevantDBNames.forEach(relevantDBName => {
			relevantData[relevantDBName].map(relevantItemID => {

				//relevantDBName/objectId/userId/{timestamp, event}
				if (map[relevantDBName]?.[relevantItemID] === undefined)
					return;

				// We have relevant DB Name, relevant Item ID, meaning there are accountIds under that dbName/itemId.
				// Let's take these accounts and add them to what is going to be come our state.
				const accountIds: string[] = _keys(map[relevantDBName][relevantItemID]);

				accountIds.forEach(_accountId => {
					updatedUserFocusMap[_accountId][relevantDBName][relevantItemID] = map[relevantDBName][relevantItemID][_accountId];
				});
			});
		});

		this.reDeriveState({userFocusMap: updatedUserFocusMap});
	}

	async componentDidMount() {
		await ModuleFE_FocusedObject.updateFocusData(this.props.focusData);
	}

	private renderUsers = () => {
		const accountIds: string[] = _keys(this.state.userFocusMap);

		return accountIds.map(_accountId => {
			const data = this.state.userFocusMap[_accountId];
			data.collections.dbName;
			return <></>;
		});
	};

	render() {
		return <LL_H_C>
			{this.renderUsers()}
		</LL_H_C>;
	}
}