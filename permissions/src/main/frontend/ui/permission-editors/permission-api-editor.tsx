import * as React from 'react';
import {DB_PermissionAPI, DBProto_PermissionAPI, ModuleFE_PermissionAccessLevel, ModuleFE_PermissionAPI, ModuleFE_PermissionDomain} from '../../_entity';
import {EditorBase, Props_EditorBase, State_EditorBase} from './editor-base';
import {sortArray, UniqueId} from '@nu-art/ts-common';
import {TS_PropRenderer, TS_Route} from '@nu-art/thunderstorm/frontend';
import {MultiSelect} from '../ui-props';
import {TS_Icons} from '@nu-art/ts-styles';

type State = State_EditorBase<DBProto_PermissionAPI>;

type Props = Props_EditorBase<DBProto_PermissionAPI> & {
	projectId: UniqueId;
};

export class PermissionAPIEditor
	extends EditorBase<DBProto_PermissionAPI, State, Props> {

	//######################### Static #########################

	static defaultProps = {
		module: ModuleFE_PermissionAPI,
		itemName: 'Permission API',
		itemNamePlural: 'Permission APIs',
		itemDisplay: (api: DB_PermissionAPI) => api.path,
	};

	static Route: TS_Route = {
		key: 'api-permission-editor',
		path: 'api-permission-editor',
		Component: this
	};

	//######################### Lifecycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		const apis = this.props.module.cache.filter(api => api.projectId === nextProps.projectId);
		state.items = sortArray([...apis], this.props.itemDisplay);
		if (!state.editedItem && state.items.length) {
			state.editedItem = this.getEditable(state.items[0]);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

	//######################### Render #########################

	editorContent = () => {
		const api = this.state.editedItem;
		if (!api)
			return;

		return <>
			<TS_PropRenderer.Vertical label={'Path'}>
				<div>{api.item.path}</div>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Access Levels'}>
				<MultiSelect.AccessLevel
					editable={api}
					prop={'accessLevelIds'}
					className={'domain-level-list'}
					itemRenderer={(levelId, onDelete) => {
						const level = ModuleFE_PermissionAccessLevel.cache.unique(levelId)!;
						const domain = ModuleFE_PermissionDomain.cache.unique(level.domainId)!;
						return <div key={levelId} className={'domain-level-list__item'}>
							<TS_Icons.x.component onClick={onDelete}/>
							{`${domain.namespace}: ${level.name} (${level.value})`}
						</div>;
					}}/>
			</TS_PropRenderer.Vertical>
		</>;
	};

	protected renderListButton = () => <></>;
}