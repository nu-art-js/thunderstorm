/*
 * Editable TextArea factory.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {TS_TextArea, TemplatingProps_TS_TextAreaV2} from '@nu-art/thunder-widgets';
import {createSaveEventHandlers, mergeSaveEvents, type SaveEventName} from './save-event-handler.js';
import {resolveEditableError, withEditableErrorProps} from './resolve-editable-error.js';
import type {EditableBaseProps} from './resolve-editable-error.js';
import type {UIProps_EditableItem} from '../core/EditableItem.js';

export type EditableItemProps_TS_TextAreaV2 = EditableBaseProps
	& UIProps_EditableItem<any, any, string>
	& { onChange?: (value: string) => void; componentRef?: React.RefObject<unknown>; saveEvent?: SaveEventName[] };

export function createEditableTextArea(templateProps: TemplatingProps_TS_TextAreaV2) {
	return (props: EditableItemProps_TS_TextAreaV2) => {
		const {editable, prop, saveEvent, componentRef, ...rest} = props;
		const _saveEvents = mergeSaveEvents(templateProps, props);
		const saveEventHandler = (value: string) => {
			return props.onChange ? props.onChange(value) : editable.updateObj({[prop]: value});
		};
		const handlers = createSaveEventHandlers<string>(_saveEvents, saveEventHandler);

		return <TS_TextArea
			{...templateProps}
			{...rest}
			error={resolveEditableError(withEditableErrorProps({...rest, editable, prop}))}
			ref={componentRef as React.RefObject<InstanceType<typeof TS_TextArea>>}
			onChange={handlers.onChange}
			onBlur={handlers.onBlur}
			onAccept={handlers.onAccept}
			value={editable.get(prop) ?? ''}/>;
	};
}
