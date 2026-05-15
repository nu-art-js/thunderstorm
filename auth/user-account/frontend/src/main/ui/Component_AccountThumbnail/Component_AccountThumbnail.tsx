import * as React from 'react';
import {cloneObj, MUSTNeverHappenException, ResolvableContent, resolveContent, UniqueId} from '@nu-art/ts-common';
import {ModuleFE_Account, OnAccountsUpdated} from '../../_entity/account/ModuleFE_Account.js';
import {DB_Account} from '@nu-art/user-account-shared';
import {TS_Icons} from '@nu-art/ts-styles';
import './Component_AccountThumbnail.scss';
import {ApiCallerEventType} from '@nu-art/db-api-shared';
import {ComponentSync, TS_ErrorBoundary} from '@nu-art/thunder-widgets';
import {_className} from '@nu-art/thunder-core';


type Props = {
	accountId: ResolvableContent<UniqueId>;
	onClick?: (e: React.MouseEvent, account: DB_Account) => void;
	acronymComposer?: (accountId: UniqueId) => string | undefined;
};

type State = {
	account: DB_Account;
	acronym: string;
};

// Going forward await modules and permissions assertions are moving to be up level stuff and not asserted by infra
// export const Component_AccountThumbnail = (props: Props & { modulesToAwait?: ModuleFE_BaseApi<any>[] }) => {
// 	const {modulesToAwait, ...rest} = props;
// 	const modules = [...(modulesToAwait ?? []), ModuleFE_Account] as unknown as ModuleFE_BaseApi<any>[];
// 	return <AwaitModules modules={filterDuplicates(modules)}
// 											 customLoader={() => <TS_Loader className={'user-thumbnail__loader'}/>}>
// 		<Component_AccountThumbnail_Impl {...rest} />
// 	</AwaitModules>;
// };

export class Component_AccountThumbnail
	extends ComponentSync<Props, State>
	implements OnAccountsUpdated {


	shouldReDeriveState() {
		return true;
	}

	__onAccountsUpdated = (...params: ApiCallerEventType<DB_Account>) => {
		this.reDeriveState();
	};

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		const accountId = resolveContent(nextProps.accountId);
		state.account = ModuleFE_Account.cache.unique(accountId)!;
		if (!state.account)
			throw new MUSTNeverHappenException(`Could not find account for id ${accountId}`);

		state.acronym = this.generateThumbnailAcronym(state.account);
		return state;
	}


	private generateThumbnailAcronym(account: DB_Account) {
		const accountAcronym = account.displayName ? account.displayName.substring(0, 2).toUpperCase() : account.email.substring(0, 2).toUpperCase();
		if (!this.props.acronymComposer)
			return accountAcronym;

		return this.props.acronymComposer(account._id) ?? accountAcronym;
	}

	private onClick = (e: React.MouseEvent) => {
		if (!this.props.onClick || !this.state.account)
			return;

		this.props.onClick(e, cloneObj(this.state.account));
	};


	render() {
		const className = _className('user-thumbnail', this.props.onClick && 'clickable');
		return <TS_ErrorBoundary>
			<div className={className} onClick={this.onClick}>
				{this.renderContent()}
				{this.renderImageUploadOverlay()}
			</div>
		</TS_ErrorBoundary>;
	}

	private renderContent = () => {
		if (this.state.account?.thumbnail)
			return this.renderUserImage();

		return <div className={'user-thumbnail__acronym'}>{this.state.acronym}</div>;
	};

	private renderUserImage = () => {
		const src = `data:image/jpeg;base64,${this.state.account!.thumbnail}`;
		return <img src={src} alt={'user-image'} className={'user-thumbnail__image'}/>;
	};

	private renderImageUploadOverlay = () => {
		if (this.props.onClick !== ModuleFE_Account.uploadAccountThumbnail)
			return;

		return <div className={'user-thumbnail__upload-image-overlay'}>
			<TS_Icons.addImage.component/>
		</div>;
	};
}
