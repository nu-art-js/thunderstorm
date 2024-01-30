import * as React from 'react';
import {HTMLProps} from 'react';
import {_className} from '../../utils/tools';
import './TS_Printable.scss';

type Props = HTMLProps<HTMLDivElement> & {
	printable: (ref: HTMLDivElement) => void;
	printOnly?: boolean;
}

export class TS_Printable
	extends React.Component<Props> {
	private ref!: HTMLDivElement;


	render() {
		const {printable, printOnly, ...props} = this.props;

		return (
			<div {...props} className={_className('ts-printable', props.className, printOnly ? 'print-only' : undefined)} ref={((ref) => {
				if (this.ref)
					return;

				this.ref = ref as HTMLDivElement;
				printable(this.ref);
				this.forceUpdate();
			})}>
				{this.props.children}
			</div>
		);
	}
}
