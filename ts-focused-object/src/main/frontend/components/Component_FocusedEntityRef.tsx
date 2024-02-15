import {ComponentSync, LL_H_C} from '@nu-art/thunderstorm/frontend';
import {
	_keys,
	_values,
	BadImplementationException,
	cloneArr,
	compare,
	generateHex,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import * as React from 'react';
import {ModuleFE_FocusedObject, OnFocusedDataReceived} from '../modules/ModuleFE_FocusedObject';
import {FocusData_Map, FocusData_Object, Focused} from '../../shared';
import {UI_Account} from '@nu-art/user-account';
import {Component_AccountThumbnail, ModuleFE_Account} from '@nu-art/user-account/frontend';
import './Component_FocusedEntityRef.scss';


type UserFocusItem = Focused & { event: FocusEvent, timestamp: number };
type UserFocusData = UserFocusItem[] // {dbName,itemId,event}[]

type Props = {
	focusData: { dbName: string, itemId?: UniqueId }[] // dbName:itemId[]
}
type State = {
	userFocusMap: TypedMap<UserFocusData> // accountId:dbName:itemId[]
}

export class Component_FocusedEntityRef
	extends ComponentSync<Props, State>
	implements OnFocusedDataReceived {
	// private timeout!: NodeJS.Timeout; // make this per account
	private focusId = generateHex(8);

	__onFocusedDataReceived(map: FocusData_Map): void {
		if (!map)
			return this.logError('Received FocusData update, but with null. Did someone delete the FocusedObject RTDB state???');

		// const ownAccountId = SessionKeyFE_Account.get()._id;
		const resultUserFocusMap: State['userFocusMap'] = {};
		const propFocusData = this.props.focusData;
		propFocusData.forEach(ownFocusData => {
			const itemId = ownFocusData.itemId;
			if (!itemId)
				throw new BadImplementationException('Received undefined instead of item in props for Component_FocusedEntityRef.');

			if (map[ownFocusData.dbName]?.[itemId] === undefined)
				return this.logWarning('FYI- component didn\'t receive relevant data.');


			//go over accountIds
			_keys(map[ownFocusData.dbName][itemId]).forEach(_accountId => {

				//go over tabs
				const latest = _values(map[ownFocusData.dbName][itemId][_accountId]).reduce<FocusData_Object>((result, current) => current.timestamp > result.timestamp ? current : result, {timestamp: -1} as FocusData_Object);

				const dataToAdd: UserFocusItem = {
					dbName: ownFocusData.dbName,
					itemId: itemId,
					timestamp: latest.timestamp,
					event: latest.event as unknown as FocusEvent //stupid typescript bug, this is a FocusEvent on both sides, and it accepts the types that contain the FocusEvent - but it insists it's a string and refuses to accept it.
				};

				resultUserFocusMap[_accountId] = resultUserFocusMap[_accountId] ?? [];
				resultUserFocusMap[_accountId].push(dataToAdd);

			});
		});

		this.reDeriveState({userFocusMap: resultUserFocusMap});
	}

	async focusObjects() {
		if (this.areThereIssuesInProps())
			return this.logWarning('Tried to focus objects while some don\'t have _id');

		await ModuleFE_FocusedObject.focusData(this.focusId, this.props.focusData as Focused[]);
	}

	async releaseObjects() {
		if (this.areThereIssuesInProps())
			return this.logWarning('Tried to release objects while some don\'t have _id');

		const toReleaseData = cloneArr(this.props.focusData);
		await ModuleFE_FocusedObject.releaseFocusData(this.focusId, toReleaseData as Focused[]);
	}

	protected deriveStateFromProps(nextProps: Props, state: Partial<State>) {
		state.userFocusMap ??= {};

		if (!compare(this.props.focusData, nextProps.focusData)) {
			// If props have changed, focus the objects.
			this.releaseObjects();
			this.focusObjects();
			// Intentionally ignoring await, we care about updating the module, we don't care waiting for it.
		}

		return super.deriveStateFromProps(nextProps, state);
	}

	async componentDidMount() {
		await this.focusObjects();
	}

	async componentWillUnmount() {
		await this.releaseObjects();
	}

	/**
	 * Returns true if there's an issue, the only one being right now is a possibly missing itemId.
	 */
	private areThereIssuesInProps = () => this.props.focusData.some(item => !item.itemId);

	// private getTooltipLogic = () => {
	// 	if (!this.shouldHaveTooltip())
	// 		return {};
	//
	// 	return {
	// 		onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
	// 			const currentTarget = e.currentTarget;
	// 			const originPos = getElementCenterPos(currentTarget);
	// 			this.timeout = setTimeout(() => {
	// 				const rect = currentTarget!.getBoundingClientRect();
	// 				const yAxisAnchor = (window.innerHeight - rect.bottom >= 380) ? 'top' : 'bottom';
	// 				const model: Model_ToolTip = {
	// 					id: 'order-pop-up',
	// 					content: <OrderPopUp_Content
	// 						dbOrder={this.state.dbOrder}
	// 						resource={this.state.resource}
	// 						runtimeOrders={this.props.runtimeOrders}
	// 						windowWidth={this.props.windowWidth}
	// 						initialDim={{width: rect.width, height: rect.height}}
	// 						openDir={yAxisAnchor === 'bottom' ? 'top' : 'bottom'}
	// 					/>,
	// 					originPos,
	// 					modalPos: {x: 0, y: 0},
	// 					contentHoverDelay: 1,
	// 					yAxisAnchor
	// 				};
	// 				ModuleFE_MouseInteractivity.showTooltip(model);
	// 			}, 300);
	// 		},
	// 		onMouseLeave: () => {
	// 			clearTimeout(this.timeout);
	// 			ModuleFE_MouseInteractivity.hide(mouseInteractivity_ToolTip);
	// 		}
	// 	};
	// };
	private renderUser = (account: UI_Account) => {
		if (!account._id)
			return;

		return <Component_AccountThumbnail accountId={account._id} key={account._id} /*{...this.getTooltipLogic()}*//>;
	};

	private renderUsers = () => {
		if (!this.state.userFocusMap)
			return;

		return (_keys(this.state.userFocusMap) as string[]).map(_accountId => {
			const account = ModuleFE_Account.cache.unique(_accountId);
			if (!account) {
				this.logError(`Failed to find account with _id ${_accountId}`);
				this.logError(`Must Fix Must Fix Must Fix Must Fix Must Fix Must Fix Must Fix Must Fix`);
				return <div key={_accountId}>Bug</div>;
			}

			return this.renderUser(account);

		});
	};

	render() {

		if (this.areThereIssuesInProps())
			return <></>;

		return <LL_H_C className={'component--focused-object'}>
			{this.renderUsers()}
		</LL_H_C>;
	}
}
