import * as React from 'react';
import './ServiceAccountEditor.scss';
import {
	_className,
	EditableItem,
	LL_H_C,
	LL_V_L,
	ModuleFE_Toaster,
	TS_Button,
	TS_Input,
	TS_TextArea
} from '@nu-art/thunderstorm/frontend';
import {ProxyServiceAccount_EditorRenderer} from './ProxyServiceAccount_EditorRenderer';
import {__stringify, filterInstances, generateUUID, isErrorOfType, PreDB, ValidationException} from '@nu-art/ts-common';
import {ModuleFE_v2_RemoteProxy, OnProxyServiceAccountUpdated} from './ModuleFE_v2_RemoteProxy';
import {Props_SmartComponent, SmartComponent, State_SmartComponent} from '@nu-art/db-api-generator/frontend';
import {ProxyServiceAccount} from '../../shared/proxy-v2';

type Props = Props_SmartComponent & {};

type State = State_SmartComponent & {
	serviceAccounts: PreDB<ProxyServiceAccount>[]
	newAccount?: Partial<ProxyServiceAccount>
	token?: string
	ttl?: number
	selectedIndex?: number
};

export class ServiceAccountEditor
	extends SmartComponent<Props, State>
	implements OnProxyServiceAccountUpdated {

	static defaultProps = {
		modules: [
			ModuleFE_v2_RemoteProxy,
		]
	};
	__OnProxyServiceAccountUpdated = () => {
		this.reDeriveState();
	};

	protected async deriveStateFromProps(nextProps: Props, state: State) {
		state.serviceAccounts = ModuleFE_v2_RemoteProxy.cache.allMutable();
		return state;
	}

	render() {
		return <LL_V_L className={'editor'}>
			<TS_Button className={'add-new-button'} onClick={() => {
				this.setState({newAccount: {}});
			}}>Create New Service Account</TS_Button>
			<LL_H_C>
				<LL_V_L>
					{filterInstances([this.state.newAccount, ...this.state.serviceAccounts]).map((serviceAcc, index) => {
						const editableItem = this.getEditableItem(serviceAcc);
						const compensatedIndex = index - (this.state.newAccount ? 1 : 0);
						return <div key={generateUUID()}
									className={_className('account', this.isSelected(serviceAcc) ? 'selected' : '')}
									onClick={() => {
										if (serviceAcc === this.state.newAccount)
											return;

										this.setState({selectedIndex: compensatedIndex});
									}}>
							<ProxyServiceAccount_EditorRenderer key={generateUUID()}
																editable={editableItem}
																onCancel={(item) => {
																	if (item.item._id) {
																		const foundItem = ModuleFE_v2_RemoteProxy.cache.unique(item.item._id);
																		if (foundItem) {
																			const serviceAccounts = this.state.serviceAccounts;
																			const foundIndex = serviceAccounts.findIndex(_item => _item._id === item.item._id);
																			serviceAccounts.splice(foundIndex, 1, foundItem);
																			this.setState({serviceAccounts: serviceAccounts});
																		}
																		return;
																	}
																	if (item.item === this.state.newAccount)
																		this.setState({newAccount: undefined});
																}}/>
						</div>;
					})}
				</LL_V_L>
				{!!this.state.serviceAccounts.length && this.renderSelectedOptions()}
			</LL_H_C>
		</LL_V_L>;
	}

	private getEditableItem(item: Partial<ProxyServiceAccount>) {
		return new EditableItem<ProxyServiceAccount>(item,
			async (item) => {
				this.logInfo('save');
				try {
					await ModuleFE_v2_RemoteProxy.v1.upsert(item).executeSync();
					if (item === this.state.newAccount)
						this.setState({newAccount: undefined});
				} catch (e: any) {
					if (isErrorOfType(e, ValidationException))
						ModuleFE_Toaster.toastError(__stringify((e as ValidationException).result, true));
				}
				return;
			}, async (item) => {
				this.logInfo('delete');
				if (!item._id) {
					this.logWarning('Can\'t delete an item with no _id!');
					return;
				}
				await ModuleFE_v2_RemoteProxy.v1.delete(item).executeSync();

			});
	}

	private renderSelectedOptions = () => {
		return <LL_V_L className={'selected-options'}>
			{this.state.token && <TS_TextArea type={'text'} value={this.state.token}/>}
			<LL_H_C>TTL: <TS_Input type={'number'}
								   onChange={(value) => this.setState({ttl: value !== undefined ? value as unknown as number : undefined})}
								   placeholder={'ttl'}/></LL_H_C>
			{this.renderAccountOptions(this.getSelected())}
		</LL_V_L>;
	};

	private renderAccountOptions = (item: Partial<ProxyServiceAccount> | undefined) => {
		return <LL_H_C>
			{item && <TS_Button onClick={async () => {
				if (!item)
					return;

				if (item === this.state.newAccount)
					this.setState({newAccount: undefined});
				else {
					await this.getEditableItem(item).delete();
					this.setState({newAccount: undefined, selectedIndex: undefined});
				}
			}}>Delete</TS_Button>}
			<TS_Button onClick={async () => {
				if (!item?._id)
					return;

				const response = await ModuleFE_v2_RemoteProxy.vv1.createAccountToken({
					serviceAccountId: item._id,
					ttl: this.state.ttl || 0
				}).executeSync();

				this.setState({token: response.token});
			}}>Create Token</TS_Button>
		</LL_H_C>;
	};

	private getSelected(): Partial<ProxyServiceAccount> | undefined {
		return this.state.selectedIndex != undefined ? this.state.serviceAccounts[this.state.selectedIndex] : undefined;
	}

	private isSelected(item: Partial<ProxyServiceAccount>): boolean {
		return item === this.getSelected();
	}
}

export const PgDev_ProxyV2 = {name: 'Proxy V2 Editor', renderer: ServiceAccountEditor};