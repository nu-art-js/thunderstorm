import {thunderstormATSGroups} from '../../consts';
import {ComponentSync} from '../../core/ComponentSync';
import {LL_H_C, LL_V_L} from '../Layouts';
import {AppToolsScreen, TS_AppTools} from '../TS_AppTools';
import * as React from 'react';
import {Button} from './Button';
import './ATS_Button.scss';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {generateHex} from '@nu-art/ts-common';

export class ATS_Button
	extends ComponentSync {

	static Screen: AppToolsScreen = {
		key: 'ats-ts-button',
		name: 'Button',
		group: thunderstormATSGroups,
		renderer: this,
	};

	//######################### Logic #########################

	private executeSyncOperation = () => {
		this.logInfo('Executed synchronous operation');
	};

	private executeAsyncOperation = () => {
		const id = generateHex(4);
		return new Promise<void>(resolve => {
			this.logInfo(`Executing asynchronous operation: ${id}`);
			setTimeout(() => {
				this.logInfo(`Resolved asynchronous operation: ${id}`);
				resolve();
			}, 3000);
		});
	};

	//######################### Render #########################

	render() {
		return <LL_V_L id={'ats__button'}>
			{TS_AppTools.renderPageHeader('Button')}
			<LL_V_L className={'ats__button__button-board'}>
				{this.render_SyncOps()}
				{this.render_AsyncOps()}
				{this.render_Disabled()}
			</LL_V_L>
		</LL_V_L>;
	}

	private render_SyncOps = () => {
		return <TS_PropRenderer.Vertical label={'Synchronous Operation'}>
			<LL_H_C className={'ats__button__buttons'}>
				<Button variant={'primary'} onClick={this.executeSyncOperation}>Primary</Button>
				<Button variant={'secondary'} onClick={this.executeSyncOperation}>Secondary</Button>
				<Button variant={'tertiary'} onClick={this.executeSyncOperation}>Tertiary</Button>
				<Button variant={'text'} onClick={this.executeSyncOperation}>Text</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	private render_AsyncOps = () => {
		return <TS_PropRenderer.Vertical label={'Asynchronous Operation'}>
			<LL_H_C className={'ats__button__buttons'}>
				<Button variant={'primary'} onClick={this.executeAsyncOperation}>Primary</Button>
				<Button variant={'secondary'} onClick={this.executeAsyncOperation}>Secondary</Button>
				<Button variant={'tertiary'} onClick={this.executeAsyncOperation}>Tertiary</Button>
				<Button variant={'text'} onClick={this.executeAsyncOperation}>Text</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	private render_Disabled = () => {
		return <TS_PropRenderer.Vertical label={'Disabled'}>
			<LL_H_C className={'ats__button__buttons'}>
				<Button variant={'primary'} disabled={true}>Primary</Button>
				<Button variant={'secondary'} disabled={true}>Secondary</Button>
				<Button variant={'tertiary'} disabled={true}>Tertiary</Button>
				<Button variant={'text'} disabled={true}>Text</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};
}