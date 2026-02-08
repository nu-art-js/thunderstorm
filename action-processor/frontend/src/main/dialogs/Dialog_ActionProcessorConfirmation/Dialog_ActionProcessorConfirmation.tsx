/*
 * @nu-art/action-processor-frontend - Action processor confirmation dialog
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ActionMetaData} from '@nu-art/action-processor-shared';
import './Dialog_ActionProcessorConfirmation.scss';

type Props = {
	action: ActionMetaData;
	onExecute: () => void | Promise<void>;
	onCancel: () => void;
};

export function Dialog_ActionProcessorConfirmation(props: Props) {
	const {action, onExecute, onCancel} = props;

	const handleExecute = () => {
		void Promise.resolve(onExecute());
	};

	return (
		<div className="dialog-action-processor-confirmation-overlay" role="dialog" onClick={onCancel}>
			<div
				className="dialog-refactoring-action-conformation"
				onClick={e => e.stopPropagation()}
			>
				<div className="dialog__header">
					<div className="dialog__header__title">Refactoring Action Confirmation</div>
				</div>
				<div className="dialog__main">
					<div className="dialog__main__warning-icon" aria-hidden>⚠</div>
					<div className="dialog__main__warning">
						<div className="dialog__main__warning__title">Action Description</div>
						<div className="dialog__main__warning__text">{action.description}</div>
					</div>
				</div>
				<div className="dialog__buttons">
					<button type="button" className="dialog__button" onClick={onCancel}>Cancel</button>
					<button type="button" className="dialog__button dialog__button--primary" onClick={handleExecute}>Execute</button>
				</div>
			</div>
		</div>
	);
}
