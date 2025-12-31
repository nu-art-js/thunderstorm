import { stopPropagation } from "@nu-art/web-client";
import { ModuleFE_Thunderstorm } from '../../modules/ModuleFE_Thunderstorm.js';
import { HTMLProps } from 'react';
export const TS_CopyToClipboard = (_props: HTMLProps<HTMLDivElement> & {
    textToCopy: string;
}) => {
    const { textToCopy, ...props } = _props;
    return (<div {...props} onClick={async (e) => {
            stopPropagation(e);
            await ModuleFE_Thunderstorm.copyToClipboard(textToCopy);
            props.onClick?.(e);
        }}>
			{props.children || textToCopy}
		</div>);
};
