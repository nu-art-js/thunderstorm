import {stopPropagation} from '@nu-art/web-client';
import {HTMLProps} from 'react';
import {ModuleFE_Clipboard} from '../../component-modules/ModuleFE_Clipboard.js';

export const TS_CopyToClipboard = (_props: HTMLProps<HTMLDivElement> & {
	textToCopy: string;
}) => {
	const {textToCopy, ...props} = _props;
	return (<div {...props} onClick={async (e) => {
		stopPropagation(e);
		await ModuleFE_Clipboard.copyToClipboard(textToCopy);
		props.onClick?.(e);
	}}>
		{props.children || textToCopy}
	</div>);
};
