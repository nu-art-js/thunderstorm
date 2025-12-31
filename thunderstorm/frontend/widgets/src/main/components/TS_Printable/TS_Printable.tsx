import * as React from 'react';
import {HTMLProps} from 'react';
import {_className} from '@nu-art/thunderstorm-frontend';
import './TS_Printable.scss';


type Props = HTMLProps<HTMLDivElement> & {
	printable: (ref: HTMLDivElement) => Promise<void>;
	printOnly?: boolean;
}

export class TS_Printable
	extends React.Component<Props> {
	private ref!: HTMLDivElement;

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<{}>, nextContext: any): boolean {
		return true;
	}

	render() {
		const {printable, printOnly, ...props} = this.props;

		return (
			<div {...props} className={_className('ts-printable', props.className, printOnly ? 'print-only' : undefined)} ref={(async (ref) => {
				if (this.ref)
					return;

				this.ref = ref as HTMLDivElement;
				await printable(this.ref);
				this.forceUpdate();
			})}>
				{this.props.children}
			</div>
		);
	}
}
