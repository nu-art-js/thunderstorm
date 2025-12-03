import {CSSProperties, MouseEvent} from 'react';
import {
	_className,
	Button,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	Model_PopUp,
	ModuleFE_MouseInteractivity,
	mouseInteractivity_PopUp
} from '@nu-art/thunderstorm-frontend';
import {WorkHubItem_MenuAction, WorkHubItem_MenuSection} from './types.js';
import {ModuleFE_WorkHub} from '../../_module/index.js';
import './Component_WorkHubActionMenu.scss';
import {TS_Icons} from '@nu-art/ts-styles';
import {generateHex} from '@nu-art/ts-common';

type Props = {
	tabId: string;
	customSections?: WorkHubItem_MenuSection[];
};

export class Component_WorkHubActionMenu
	extends ComponentSync<Props> {

	// ######################## Static ########################

	static show = (e: MouseEvent<HTMLDivElement>, props: Props) => {
		const model: Model_PopUp = {
			id: 'work-hub-action-menu',
			content: () => <Component_WorkHubActionMenu {...props}/>,
			originPos: {x: e.clientX, y: e.clientY},
			modalPos: {x: 1, y: 1},
		};
		ModuleFE_MouseInteractivity.showContent(model);
	};

	// ######################## Logic ########################

	private generateGeneralSection = (): WorkHubItem_MenuSection => {
		return {
			actions: [
				{label: 'Close', action: () => ModuleFE_WorkHub.tabs.remove(this.props.tabId)}
			]
		};
	};

	private getSections = (): WorkHubItem_MenuSection[] => {
		return [
			this.generateGeneralSection(),
			...(this.props.customSections ?? [])
		];
	};

	private closeMenu = () => {
		ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
	};

	// ######################## Render ########################

	render() {
		const sections = this.getSections();
		return sections.map(this.render_Section);
	}

	private render_Section = (section: WorkHubItem_MenuSection, index: number) => {
		return <LL_V_L key={index} className={'action-menu__section'}>
			{!!section.label?.length && <div className={'action-menu__section-label'}>{section.label}</div>}
			{section.actions.map(this.render_Action)}
		</LL_V_L>;
	};

	private render_Action = (action: WorkHubItem_MenuAction, index: number) => {
		if (action.action)
			return this.render_ActionButton(action, index);

		return this.render_ActionWithInner(action, index);
	};

	private render_ActionButton = (action: WorkHubItem_MenuAction, index: number) => {
		return <Button
			key={index}
			variant={'work-hub-menu-action'}
			disabled={action.disabled}
			onClick={async () => {
				await action.action!();
				this.closeMenu();
			}}>
			{action.label}
		</Button>;
	};

	private render_ActionWithInner = (action: WorkHubItem_MenuAction, index: number) => {
		const hasInner = !!action.innerActions?.length;
		const renderInner = hasInner && !action.disabled;
		const anchorId = generateHex(4);
		const style = {'--anchor-id': anchorId} as CSSProperties;
		const className = _className('work-hub-menu-action-with-inner', action.disabled && 'disabled');
		return <div className={className} style={style} key={index}>
			<LL_H_C className={'work-hub-menu-action'}>
				<div className={'work-hub-menu-action__label'}>{action.label}</div>
				{hasInner && <TS_Icons.treeCollapse.component/>}
			</LL_H_C>
			{renderInner && <LL_V_L className={'work-hub-menu-action__inner-actions'}>
				{action.innerActions?.map(this.render_Action)}
			</LL_V_L>}
		</div>;
	};
}