import * as React from 'react';
import {HTMLProps} from 'react';
import {_className} from '../../utils/tools';
import './TS_Printable.scss';


export class TS_Printable
	extends React.Component<HTMLProps<HTMLDivElement> & { printable: (ref: HTMLDivElement) => void }> {
	private ref!: HTMLDivElement;


	render() {
		const {printable, ...props} = this.props;

		return (
			<div {...props} className={_className('ts-printable', props.className)} ref={((ref) => {
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
