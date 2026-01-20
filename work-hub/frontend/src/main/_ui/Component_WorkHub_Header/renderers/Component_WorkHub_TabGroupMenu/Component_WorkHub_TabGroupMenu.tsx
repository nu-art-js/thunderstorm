import {ComponentSync, EditableItem, LL_H_C, Model_PopUp, ModuleFE_MouseInteractivity, TS_Input} from '@nu-art/thunderstorm-frontend';
import {WorkHubTabGroup} from '@nu-art/work-hub-shared';
import {createRef, CSSProperties, MouseEvent} from 'react';
import {ModuleFE_WorkHub} from '../../../../_module/index.js';
import {BadImplementationException, compare} from '@nu-art/ts-common';
import './Component_WorkHub_TabGroupMenu.scss';
import {workHubTabGroupColors} from '../Component_WorkHub_TabGroup/consts.js';

type Props = {
	group: WorkHubTabGroup;
};

type State = {
	group: EditableItem<WorkHubTabGroup>;
};

export class Component_WorkHub_TabGroupMenu
	extends ComponentSync<Props, State> {

	private inputRef = createRef<HTMLInputElement>();

	// ######################## Static ########################

	static show = (e: MouseEvent<HTMLDivElement>, groupKey: string) => {
		const group = ModuleFE_WorkHub.group.get(groupKey);
		if (!group)
			throw new BadImplementationException(`Did not find group for key ${groupKey}`);

		const rect = e.currentTarget.getBoundingClientRect();
		const model: Model_PopUp = {
			id: 'pop-up__work-hub-tab-group-menu',
			modalPos: {x: 1, y: 1},
			originPos: {x: rect.x, y: rect.bottom},
			offset: {y: 4},
			content: () => <Component_WorkHub_TabGroupMenu group={group}/>,
		};
		ModuleFE_MouseInteractivity.showContent(model);
	};

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.group = this.getEditable(nextProps.group);
		return state;
	}

	componentDidMount() {
		this.inputRef.current?.focus();
	}

	componentDidUpdate() {
		this.inputRef.current?.focus();
	}

	// ######################## Logic ########################

	private getEditable(group: WorkHubTabGroup) {
		return new EditableItem(group)
			.setOnChanged(async () => this.forceUpdate())
			.setSaveAction(async group => {
				ModuleFE_WorkHub.group.update(group.groupKey, group);
				return group;
			})
			.setAutoSave(true);
	}

	// ######################## Render ########################

	render() {
		return <>
			{this.render_Label()}
			{this.render_Color()}
		</>;
	}

	private render_Label = () => {
		return <TS_Input
			type={'text'}
			value={this.state.group.item.label}
			onChange={value => this.state.group.updateObj({label: value})}
			innerRef={this.inputRef}
		/>;
	};

	private render_Color = () => {
		return <LL_H_C className={'color-selection'}>
			{workHubTabGroupColors.map((scheme, index) => {
				const style = {'--color': scheme.foreground} as CSSProperties;
				const selected = compare(scheme, this.state.group.item.color);
				return <div
					key={index}
					className={selected ? 'selected' : undefined}
					style={style}
					onClick={() => {
						this.state.group.updateObj({color: scheme});
					}}
				/>;
			})}
		</LL_H_C>;
	};
}