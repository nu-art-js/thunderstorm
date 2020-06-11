/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {
	ToastBuilder,
	ToastModule,
	ToastType
} from "@nu-art/thunderstorm/frontend";
import * as emotion from 'emotion';
import {
	_paddingTop
} from "@res/styles";
import {ICONS} from '@res/icons';

const toasterStyle = emotion.css`
	width: 384px;
	padding: 12px 15px 11px 14px;
`;

const textStyle = emotion.css`
	color: #fff; 
	font-size: 13px;
  letter-spacing: -0.18px;
  margin-right: 12px;
`;

export const InfoToast = (message: string, duration?: number) => createToast(ToastType.info, message, duration);
export const ErrorToast = (message: string, duration?: number) => createToast(ToastType.error, message, duration);
export const SuccessToast = (message: string, duration?: number) => createToast(ToastType.success, message, duration);

const createToast = (type: ToastType, message: string, duration?: number) => {
	const iconPicker = () => {
		switch (type) {
			case ToastType.info:
				return ICONS.infoToast;
			case ToastType.error:
				return ICONS.errorToast;
			case ToastType.success:
				return ICONS.successToast;
		}
	};

	const BgPicker = () => {
		switch (type) {
			case ToastType.info:
				return "#49addb";
			case ToastType.error:
				return "#ff4436";
			case ToastType.success:
				return "#1cc65a";
		}
	};

	const _message = ToastModule.adjustStringMessage(message);

	const content = (
		<div className={`ll_h_c ${_paddingTop(5)}`}>
			{iconPicker()(undefined, 14)}
			<div className={textStyle}>{_message}</div>
		</div>
	);

	const closeButton = <div onClick={() => ToastModule.hideToast()}>{ICONS.close(undefined, 14)}</div>;

	const toast = new ToastBuilder()
		.setContent(content)
		.setBackground(BgPicker())
		.setClassName(toasterStyle)
		.setActions([closeButton]);
	duration && toast.setDuration(duration);
	toast.show();
};
