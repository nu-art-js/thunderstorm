/*
 * @nu-art/action-processor-frontend - Action processor ATS screen component
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useCallback, useEffect, useState} from 'react';
import {_keys, TypedMap} from '@nu-art/ts-common';
import {ActionMetaData} from '@nu-art/action-processor-shared';
import {ModuleFE_ActionProcessor} from '../ModuleFE_ActionProcessor.js';
import {Dialog_ActionProcessorConfirmation} from '../dialogs/Dialog_ActionProcessorConfirmation/index.js';
import './ATS_ActionProcessor.scss';

export function ATS_ActionProcessor() {
	const [actions, setActions] = useState<ActionMetaData[]>([]);
	const [actionsInProgress, setActionsInProgress] = useState<string[]>([]);
	const [confirmAction, setConfirmAction] = useState<ActionMetaData | null>(null);

	useEffect(() => {
		ModuleFE_ActionProcessor.vv1.list({}).executeSync().then(setActions).catch(() => setActions([]));
	}, []);

	const onButtonClick = useCallback((action: ActionMetaData) => {
		setConfirmAction(action);
	}, []);

	const onExecute = useCallback(async (action: ActionMetaData) => {
		setActionsInProgress(prev => [...prev, action.key]);
		setConfirmAction(null);
		try {
			await ModuleFE_ActionProcessor.vv1.execute({key: action.key}).executeSync();
		} finally {
			setActionsInProgress(prev => prev.filter(k => k !== action.key));
		}
	}, []);

	const onCancelConfirm = useCallback(() => setConfirmAction(null), []);

	const groups = actions.reduce<TypedMap<ActionMetaData[]>>((acc, curr) => {
		if (!acc[curr.group])
			acc[curr.group] = [];
		acc[curr.group].push(curr);
		return acc;
	}, {});

	return (
		<div className="refactoring-actions-page">
			<h1 className="refactoring-actions-page__title">Refactoring Actions</h1>
			<div className="action-groups">
				{groups && _keys(groups).map(key => (
					<div className="action-group" key={key}>
						<div className="action-group__title">{key}</div>
						<div className="action-group__buttons">
							{groups[key].map(action => (
								<button
									key={action.key}
									type="button"
									className="action-group__button"
									onClick={() => onButtonClick(action)}
									disabled={actionsInProgress.includes(action.key)}
								>
									{action.key.replace(/-/g, ' ')}
								</button>
							))}
						</div>
					</div>
				))}
			</div>
			{confirmAction && (
				<Dialog_ActionProcessorConfirmation
					action={confirmAction}
					onExecute={() => onExecute(confirmAction)}
					onCancel={onCancelConfirm}
				/>
			)}
		</div>
	);
}
