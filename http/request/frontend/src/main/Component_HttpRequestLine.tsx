/*
 * @nu-art/http-request-frontend — one request line
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Button, LL_H_C} from '@nu-art/thunder-widgets';
import {TS_Icons} from '@nu-art/ts-styles';

type Props = {
	label: string;
	value?: string;
	onOpen: () => void;
	onRemove?: () => void;
	removeLabel?: string;
};

export function Component_HttpRequestLine(props: Props) {
	const shown = props.value?.trim() ? props.value : 'Empty';
	const removeLabel = props.removeLabel ?? `Remove ${props.label}`;
	return <LL_H_C className={'http-request-editor__line'}>
		<Button variant={'text'} className={'http-request-editor__open'} onClick={props.onOpen}>
			<div className={'http-request-editor__label'}>{props.label}</div>
			<div className={'http-request-editor__value'} data-empty={shown === 'Empty' ? 'true' : 'false'}>{shown}</div>
		</Button>
		{props.onRemove
			? <Button
				variant={'text'}
				className={'http-request-editor__icon'}
				aria-label={removeLabel}
				title={removeLabel}
				onClick={event => {
					event.stopPropagation();
					props.onRemove?.();
				}}>
				<TS_Icons.bin.component/>
			</Button>
			: null}
	</LL_H_C>;
}
