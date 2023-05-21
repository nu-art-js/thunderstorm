import {HTMLProps} from 'react';
import * as React from 'react';
import {stopPropagation} from '../../utils/tools';
import {ModuleFE_Thunderstorm} from '../../modules';


export const TS_CopyToClipboard = (_props: HTMLProps<HTMLDivElement> & { textToCopy: string }) => {
	const {textToCopy, ...props} = _props;
	return (
		<div {...props} onClick={async (e) => {
			stopPropagation(e);
			await ModuleFE_Thunderstorm.copyToClipboard(textToCopy);
			props.onClick?.(e);
		}}>
			{props.children || textToCopy}
		</div>
	);
};
