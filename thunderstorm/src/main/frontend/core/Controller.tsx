import {ComponentSync} from './ComponentSync';
import * as React from 'react';
import {TS_ErrorBoundary} from '../components/TS_ErrorBoundary';

export type Props_Controller = {
	ignoreError?: boolean
}

export class Controller<P = {}, State = {},
	Props extends Props_Controller & P = Props_Controller & P>
	extends ComponentSync<Props, State> {

	constructor(props: Props) {
		super(props);

		const __render = this.render.bind(this);

		// override default render to make sure error boundary is added if needed
		this.render = () => {
			if (this.props.ignoreError)
				return __render();

			return <TS_ErrorBoundary
				onClick={this.onErrorBoundaryClick}>
				{__render()}
			</TS_ErrorBoundary>;
		};
	}

	/**
	 * Default on click on error boundary event
	 * @param e - Mouse click event
	 */
	protected onErrorBoundaryClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.metaKey)
			return this.logInfo('Component props and state', this.props, this.state);

		if (e.shiftKey) {
			this.logInfo('Re-deriving state');
			return this.reDeriveState();
		}

		this.forceUpdate();
	};

}