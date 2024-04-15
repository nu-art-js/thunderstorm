import * as React from 'react';
import {BadImplementationException, ResolvableContent, resolveContent} from '@nu-art/ts-common';

type Props_ShowIf = {
	children: React.ReactNode;
	condition: ResolvableContent<boolean | undefined>;
}

type Props_ShowElse = {
	children: React.ReactNode;
}

type Props_Show = {
	children: React.ReactElement<Props_ShowIf | Props_ShowElse>[];
}


const ShowIf: React.FC<Props_ShowIf> = (props) => {
	return <>{props.children}</>;
};

const ShowElse: React.FC<Props_ShowElse> = (props) => {
	return <>{props.children}</>;
};

type ShowType = ((props: Props_Show) => React.JSX.Element) & { If: typeof ShowIf; Else: typeof ShowElse }

export const Show: ShowType = (props) => {
	const toRender: React.JSX.Element[] = [];
	let elseRender: React.JSX.Element | undefined;

	React.Children.forEach(props.children, (child) => {
		if (!React.isValidElement(child) || ![ShowIf, ShowElse].includes(child.type as any))
			throw new BadImplementationException('Children of Show component must be Show.If or Show.Else');

		if (child.type === ShowElse) {
			if (elseRender)
				throw new BadImplementationException('Show must have only 1 Show.Else child');
			return elseRender = child;
		}

		if (!resolveContent((child.props as Props_ShowIf).condition))
			return;

		toRender.push(child);
	});

	if (toRender.length)
		return <>{...toRender}</>;

	return elseRender ?? <></>;
};

Show.If = ShowIf;
Show.Else = ShowElse;