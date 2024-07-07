import * as React from 'react';
import {_className, AwaitModules, ComponentSync, ModuleFE_BaseApi, TS_ErrorBoundary, TS_Loader} from '@nu-art/thunderstorm/frontend';
import {cloneObj, filterDuplicates, MUSTNeverHappenException, UniqueId} from '@nu-art/ts-common';
import {ModuleFE_Account, OnAccountsUpdated} from '../../../_entity/account/frontend/ModuleFE_Account';
import {DB_Account, DBProto_Account} from '../../../shared';
import {TS_Icons} from '@nu-art/ts-styles';
import './Component_AccountThumbnail.scss';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


type Props = {
	accountId: () => UniqueId;
	onClick?: (e: React.MouseEvent, account: DB_Account) => void;
	acronymComposer?: (accountId: UniqueId) => string | undefined;
};

type State = {
	account: DB_Account;
	acronym: string;
};

export const Component_AccountThumbnail = (props: Props & { modulesToAwait?: ModuleFE_BaseApi<any>[] }) => {
	const {modulesToAwait, ...rest} = props;
	const modules = [...(modulesToAwait ?? []), ModuleFE_Account] as unknown as ModuleFE_BaseApi<any>[];
	return <AwaitModules modules={filterDuplicates(modules)}
						 customLoader={() => <TS_Loader className={'user-thumbnail__loader'}/>}>
		<Component_AccountThumbnail_Impl {...rest} />
	</AwaitModules>;
};

class Component_AccountThumbnail_Impl
	extends ComponentSync<Props, State>
	implements OnAccountsUpdated {

	// ######################### Lifecycle #########################

	shouldReDeriveState() {
		return true;
	}

	__onAccountsUpdated = (...params: ApiCallerEventType<DBProto_Account>) => {
		this.reDeriveState();
	};

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.account = ModuleFE_Account.cache.unique(nextProps.accountId())!;
		if (!state.account)
			throw new MUSTNeverHappenException(`Could not find account for id ${nextProps.accountId}`);

		state.acronym = this.generateThumbnailAcronym(state.account);
		return state;
	}

	// ######################### Logic #########################

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

	// ######################### Render #########################

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