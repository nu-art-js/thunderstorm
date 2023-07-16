import * as React from 'react';
import './ServiceAccountEditor.scss';
import {EditableItem, LL_H_C, LL_V_L, ModuleFE_Toaster, TS_Button} from '@nu-art/thunderstorm/frontend';
import {ProxyServiceAccount_EditorRenderer} from './ProxyServiceAccount_EditorRenderer';
import {
	__stringify,
	dbObjectToId,
	exists,
	generateUUID,
	isErrorOfType,
	PreDB,
	sortArray,
	ValidationException
} from '@nu-art/ts-common';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {ModuleFE_RemoteProxyV2, OnProxyServiceAccountUpdated} from './ModuleFE_RemoteProxyV2';
import {Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/db-api-generator/frontend';

type Props = Props_SmartComponent & {};

type State = State_SmartComponent & {
	serviceAccounts: PreDB<ProxyServiceAccount>[]
};

export class ServiceAccountEditor
	extends SmartComponent<Props, State>
	implements OnProxyServiceAccountUpdated {

	static defaultProps = {
		modules: [
			ModuleFE_RemoteProxyV2,
		]
	};

	protected async deriveStateFromProps(nextProps: Props, state: State) {
		const allAccounts = ModuleFE_RemoteProxyV2.cache.allMutable();

		state.serviceAccounts = state.serviceAccounts?.filter(account => account._id && allAccounts.map(dbObjectToId).includes(account._id)) ?? [];
		const unfinishedAccounts = state.serviceAccounts.length ? sortArray(state.serviceAccounts.filter(acc => !acc._id), item => item.email || item.label) : [];
		state.serviceAccounts = [...unfinishedAccounts, ...allAccounts];
		return state;
	}


	render() {
		return <LL_V_L className={'editor'}>
			<TS_Button className={'add-new-button'} onClick={() => {
				const newAccounts = this.state.serviceAccounts;
				newAccounts.push({} as PreDB<ProxyServiceAccount>);
				this.setState({serviceAccounts: newAccounts});
				this.forceUpdate();
			}}>Add New</TS_Button>
			{this.state?.serviceAccounts?.map((serviceAcc, index) => {
				const editableItem = new EditableItem<ProxyServiceAccount>(serviceAcc,
					async (item) => {
						this.logInfo('save');
						try {
							await ModuleFE_RemoteProxyV2.v1.upsert(item).executeSync();
						} catch (e: any) {
							if (isErrorOfType(e, ValidationException))
								ModuleFE_Toaster.toastError(__stringify((e as ValidationException).result, true));
						}
						return;
					}, async (item) => {
						this.logInfo('delete');
						await ModuleFE_RemoteProxyV2.v1.delete(item).executeSync();

					});
				return <LL_H_C key={generateUUID()}>
					<ProxyServiceAccount_EditorRenderer 														editable={editableItem}
														onCancel={(item) => {
															if (!exists(item.item._id))
																this.removeAccountAtIndex(index);
														}}/>
					<TS_Button onClick={async () => {
						await editableItem.delete();
					}}>Delete</TS_Button>
				</LL_H_C>;
			})}
		</LL_V_L>;
	}

	private removeAccountAtIndex = (index: number) => {
		const accounts = this.state.serviceAccounts;
		accounts.splice(index, 1);
		this.setState({serviceAccounts: accounts});
		this.forceUpdate();
	};

	__OnProxyServiceAccountUpdated = () => {
		this.reDeriveState();
	};
}

export const PgDev_ProxyV2 = {name: 'Proxy V2 Editor', renderer: ServiceAccountEditor};