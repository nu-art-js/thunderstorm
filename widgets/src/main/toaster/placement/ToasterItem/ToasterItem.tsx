import {_className} from '@nu-art/thunder-core';
import {LL_H_C} from '../../../layouts/v1/Layouts.js';
import {CSSProperties, FC} from 'react';
import {ToastItemStatus} from '../types.js';
import {Model_Toast} from '@nu-art/toasting';
import './ToasterItem.scss';
import {TS_Icons} from '@nu-art/ts-styles';
import {exists, resolveContent} from '@nu-art/ts-common';
import {ModuleFE_Toasting} from '@nu-art/toasting';

type Props = {
	model: Model_Toast;
	status: ToastItemStatus;
	style?: CSSProperties;
};

const statusToClass: { [K in ToastItemStatus]: string } = {
	[ToastItemStatus.Loaded]: 'loaded',
	[ToastItemStatus.Visible]: 'visible',
	[ToastItemStatus.Closed]: 'closing',
};

export const ToasterItem: FC<Props> = (props) => {
	const className = _className('toaster-item', statusToClass[props.status]);
	return <div
		className={className}
		style={{
			...props.style,
			['--timer-duration']: `${props.model.duration}ms`
		} as CSSProperties}
		data-variant={props.model.variant}
		data-id={props.model.id}
		data-duration={`${props.model.duration}ms`}
	>
		<LL_H_C className={'toaster-item-header'}>
			<div className={'toaster-item-header__title'}>
				{resolveContent(props.model.title)}
			</div>
			<TS_Icons.x.component onClick={() => {
				ModuleFE_Toasting.toast.close(props.model.id);
			}}/>
		</LL_H_C>
		{exists(props.model.body) && <p className={'toaster-item-body'}>{resolveContent(props.model.body)}</p>}
		<div className={'toaster-item-timer'}/>
	</div>;
};