import * as React from 'react';
import {
	_className,
	ComponentSync,
	getElementCenterPos,
	Grid,
	LL_H_C,
	LL_V_C,
	LL_V_L,
	ModuleFE_MouseInteractivity,
	ModuleFE_Thunderstorm,
	mouseInteractivity_PopUp,
	TS_Button,
	TS_ComponentTransition,
	TS_ErrorBoundary
} from '@nu-art/thunderstorm/frontend';
import {ResolvableContent, resolveContent, RuntimeVersion, TypedMap, UniqueId} from '@nu-art/ts-common';
import {DB_Account} from '../../../shared';
import {ModuleFE_Account} from '../../../_entity/account/frontend/ModuleFE_Account';
import {Component_AccountThumbnail} from '../Component_AccountThumbnail/Component_AccountThumbnail';
import './PopUp_AccountMenu.scss';
import {Component_ChangePassword} from '../Component_ChangePassword/Component_ChangePassword';


type ModalProps = {
	modalPos?: { x: number, y: number };
	offset?: { x: number, y: number };
}

type Props = {
	accountId: UniqueId
	accountDisplayModifier?: (account: DB_Account) => string | undefined;
	acronymComposer?: (accountId: UniqueId) => string | undefined;
	menuActions?: ResolvableContent<PopUp_AccountMenu_Action>[];
};

type State = {
	account?: DB_Account
	menuActions?: PopUp_AccountMenu_Action[];
	pageKey?: string;
	prevPageKey?: string;
	pageMap: TypedMap<PopUp_AccountMenu_Action_ContentFunction>
};

export type PopUp_AccountMenu_Action_ContentFunction = (account: DB_Account, leaveMenuTrigger: VoidFunction) => React.ReactNode

export type PopUp_AccountMenu_Action = {
	label: string;
} & (
	{ type: 'page', pageKey: string, content: PopUp_AccountMenu_Action_ContentFunction }
	| { type: 'action', closePopUp?: boolean, action: () => (Promise<void> | void) }
	)

export class PopUp_AccountMenu
	extends ComponentSync<Props, State> {

	// ######################### Static #########################

	static show(e: React.MouseEvent, props: Props, modalProps?: ModalProps) {
		ModuleFE_MouseInteractivity.showContent({
			id: 'pop-up__account-menu',
			originPos: getElementCenterPos(e.currentTarget),
			modalPos: modalProps?.modalPos ?? {x: -1, y: 1},
			content: () => <PopUp_AccountMenu {...props}/>,
			offset: modalProps?.offset,
		});
	}

	static Action_AppToolsButton = (url: string) => ({
		label: 'App Tools',
		type: 'action',
		closePopUp: true,
		action: () => {
			ModuleFE_Thunderstorm.openUrl(url, '_blank');
		}
	} as PopUp_AccountMenu_Action);

	static Action_EditPassword = {
		label: 'Edit Password',
		type: 'page',
		pageKey: 'edit-password',
		content: (account, closePageTrigger) => <Component_ChangePassword postSubmitAction={closePageTrigger}/>
	} as PopUp_AccountMenu_Action;

	static defaultProps: Partial<Props> = {
		menuActions: [PopUp_AccountMenu.Action_AppToolsButton('/app-tools'), PopUp_AccountMenu.Action_EditPassword]
	};

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.account = ModuleFE_Account.cache.unique(nextProps.accountId);
		if (!state.account)
			this.logError('Could not get account', `account id: ${nextProps.accountId}`);

		//Gather menu actions
		state.menuActions = nextProps.menuActions?.map(menuAction => resolveContent(menuAction));

		//Prepare page map from actions
		state.pageMap = state.menuActions?.reduce((map, action) => {
			if (action.type === 'page')
				map[action.pageKey] = action.content;
			return map;
		}, {} as TypedMap<PopUp_AccountMenu_Action_ContentFunction>) ?? {};
		return state;
	}

	// ######################### Logic #########################

	private closePopUp = () => {
		ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
	};

	private logOut = async () => {
		this.closePopUp();
		ModuleFE_Account.logout();
	};

	private onActionClick = (action: PopUp_AccountMenu_Action) => {
		switch (action.type) {
			case 'action': {
				if (action.closePopUp)
					this.closePopUp();
				action.action();
				break;
			}

			case 'page': {
				this.setState({pageKey: action.pageKey, prevPageKey: action.pageKey});
				break;
			}

			default:
				// @ts-ignore
				this.logError(`Unknown action type ${action.type}`);
		}
	};

	private closeCustomPage = () => {
		this.setState({pageKey: undefined});
	};

	// ######################### Render #########################

	render() {
		return <TS_ErrorBoundary>
			{this.renderNoAccount()}
			{this.renderAccount()}
		</TS_ErrorBoundary>;
	}

	private renderNoAccount = () => {
		if (this.state.account)
			return;

		return <div className={'account-menu__not-found'}>Account Not Found</div>;
	};

	private renderAccount = () => {
		if (!this.state.account)
			return;

		return <>
			<LL_V_L className={'account-menu'}>
				{this.renderHeader()}
				{this.renderBody()}
				{this.renderFooter()}
			</LL_V_L>
			{this.renderCustomPage()}
		</>;
	};

	private renderSeparatorBar = (style?: React.CSSProperties) => {
		return <span className={'account-menu__separator'} style={style}/>;
	};

	// ######################### Render - Account Parts #########################

	private renderHeader = () => {
		const account = this.state.account;
		if (!account)
			return;

		const accountDisplay = this.props.accountDisplayModifier?.(account) ?? account.displayName ?? account.email;
		return <>
			<LL_H_C className={'account-menu__header'}>
				<Component_AccountThumbnail accountId={() => account._id} acronymComposer={this.props.acronymComposer}/>
				<div className={'account-menu__header__display-name'}>{accountDisplay}</div>
			</LL_H_C>
			{this.renderSeparatorBar()}
		</>;
	};

	private renderBody = () => {
		const account = this.state.account;
		if (!account)
			return;

		return <Grid className={'account-menu__body'}>
			{this.state.menuActions?.map((menuAction, i) => {
				return <TS_Button key={i} onClick={() => this.onActionClick(menuAction)}>{menuAction.label}</TS_Button>;
			})}
		</Grid>;
	};

	private renderFooter = () => {
		const account = this.state.account;
		if (!account)
			return;

		return <>
			{this.renderSeparatorBar({marginTop: 'auto'})}
			<LL_V_C className={'account-menu__footer'}>
				<TS_Button onClick={this.logOut}>Log Out</TS_Button>
				<div className="version">{RuntimeVersion()}</div>
			</LL_V_C>
		</>;
	};

	// ######################### Render - Custom Page #########################

	private renderCustomPage = () => {
		const pageKey = this.state.pageKey;
		const account = this.state.account;
		if (!account)
			return;

		const className = _className('account-menu__custom-page', !!pageKey && 'show');
		return <LL_V_L className={className}>
			<div className={'account-menu__custom-page__back-button'} onClick={this.closeCustomPage}>Back</div>
			<TS_ComponentTransition trigger={!!pageKey} unmountTimeout={200} onExitDone={() => this.setState({prevPageKey: undefined})}>
				{this.state.pageMap[pageKey ?? this.state.prevPageKey!]?.(account, this.closeCustomPage)}
			</TS_ComponentTransition>
		</LL_V_L>;
	};
}