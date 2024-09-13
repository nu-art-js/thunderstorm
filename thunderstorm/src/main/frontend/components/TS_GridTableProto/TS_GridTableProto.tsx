import * as React from 'react';
import {Fragment} from 'react';
import './TS_GridTableProto.scss';
import {
	DBProto,
	ResolvableContent,
	resolveContent
} from '@nu-art/ts-common';
import {
	Grid,
	LinearLayoutProps
} from '../Layouts';
import {
	TemplatingProps_EditableItemController,
	TS_EditableItemController
} from '../TS_EditableItemController';
import {Editable_SaveAction} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';


type Props_TS_GridTableProto<Proto extends DBProto<any>, EditorProps extends object = object> =
	Omit<LinearLayoutProps, 'autoSave'>
	& TemplatingProps_EditableItemController<Proto, EditorProps>
	& {
	saveAction?: Editable_SaveAction<Proto['uiType']>
	items: ResolvableContent<Proto['uiType'][]>
	sorter?: (items: Proto['uiType'][]) => Proto['uiType'][]
	Header?: ResolvableContent<React.ReactNode>,
}

type State_TS_GridTable = {
//
}

export class TS_GridTableProto<Proto extends DBProto<any>, EditorProps extends object = object>
	extends ComponentSync<Props_TS_GridTableProto<Proto, EditorProps>, State_TS_GridTable> {

	render() {
		const {
			      items,
			      className,
			      sorter,
			      Header,
			      editorProps,
			      createInitialInstance,
			      onError,
			      autoSave,
			      saveAction,
			      module,
			      editor,
			      ...props
		      } = this.props;

		const resolvedItems = (sorter ?? DefaultSorter)(resolveContent(items));
		const ItemController = (item: Proto['uiType'], index: number) => {
			return <TS_EditableItemController<Proto, EditorProps>
				module={module}
				editor={editor}
				autoSave={autoSave}
				editorProps={{...editorProps, index} as EditorProps}
				onError={onError}
				key={item._id}
				item={item}/>;
		};


		const NewItemController = createInitialInstance && <TS_EditableItemController<Proto, EditorProps>
			module={module}
			editor={editor}
			onError={onError}
			autoSave={autoSave}
			saveAction={saveAction}
			onSave={(item) => this.forceUpdate()}
			editorProps={editorProps}
			key={`new-${items.length}`}
			createInitialInstance={createInitialInstance}/>;

		return <Grid className={_className('ts-grid-table', className)} {...props}>
			{Header && resolveContent(Header)}
			{resolvedItems.map((item, i) => {
				return <Fragment key={item._id}>
					{resolveContent(ItemController, item, i)}
				</Fragment>;
			})}
			{NewItemController && resolveContent(NewItemController, resolvedItems.length)}
		</Grid>;
	}
}

const DefaultSorter = <T extends object>(items: T[]) => items;