/*
 * @nu-art/http-request-frontend — dialog title and close icon
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Button, LL_H_C} from '@nu-art/thunder-widgets';
import {TS_Icons} from '@nu-art/ts-styles';

type Props = {
	title: string;
	onClose: () => void;
};

export function Component_DialogHeader(props: Props) {
	return <LL_H_C className={'dialog__http-request__header'}>
		<div className={'dialog__http-request__title'}>{props.title}</div>
		<Button
			variant={'text'}
			className={'dialog__http-request__close'}
			aria-label={'Close'}
			title={'Close'}
			onClick={props.onClose}>
			<TS_Icons.x.component/>
		</Button>
	</LL_H_C>;
}
