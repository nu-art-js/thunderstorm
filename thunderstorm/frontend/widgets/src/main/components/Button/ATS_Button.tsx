import { thunderstormATSGroups } from '../../consts.js';
import { ComponentSync } from "@nu-art/thunder-routing";
import { LL_H_C, LL_V_L } from '../Layouts/index.js';
import { AppToolsScreen, TS_AppTools } from '../TS_AppTools/index.js';
import { Button } from './Button.js';
import './ATS_Button.scss';
import { TS_PropRenderer } from '../TS_PropRenderer/index.js';
import { generateHex } from '@nu-art/ts-common';
type Props = {};
type State = {
    inProgress: boolean;
};
export class ATS_Button extends ComponentSync<Props, State> {
    static Screen: AppToolsScreen = {
        key: 'ats-ts-button',
        name: 'Button',
        group: thunderstormATSGroups,
        renderer: this,
    };
    //######################### Life Cycle #########################
    protected deriveStateFromProps(nextProps: Props, state: State) {
        state.inProgress ??= false;
        return state;
    }
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
    private executeInProgressOperation = () => {
        return new Promise<void>(resolve => {
            this.logInfo('Executing InProgress operation');
            this.setState({ inProgress: true }, () => {
                setTimeout(() => this.setState({ inProgress: false }, () => {
                    this.logInfo('Resolved InProgress operation');
                    resolve();
                }), 3000);
            });
        });
    };
    //######################### Render #########################
    render() {
        return <LL_V_L id={'ats__button'}>
			{TS_AppTools.renderPageHeader('Button')}
			<LL_V_L className={'ats__button__button-board'}>
				{this.render_SyncOps()}
				{this.render_AsyncOps()}
				{this.render_ControlledInProgress()}
				{this.render_Disabled()}
				{this.render_RandomTests()}
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
				<Button variant={'dangerous'} onClick={this.executeSyncOperation}>Dangerous</Button>
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
				<Button variant={'dangerous'} onClick={this.executeAsyncOperation}>Dangerous</Button>
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
				<Button variant={'dangerous'} disabled={true}>Dangerous</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
    };
    private render_ControlledInProgress = () => {
        return <TS_PropRenderer.Vertical label={'In Progress Operation'}>
			<LL_H_C className={'ats__button__buttons'}>
				<Button variant={'primary'} actionInProgress={this.state.inProgress} onClick={this.executeInProgressOperation}>Primary</Button>
				<Button variant={'secondary'} actionInProgress={this.state.inProgress} onClick={this.executeInProgressOperation}>Secondary</Button>
				<Button variant={'tertiary'} actionInProgress={this.state.inProgress} onClick={this.executeInProgressOperation}>Tertiary</Button>
				<Button variant={'text'} actionInProgress={this.state.inProgress} onClick={this.executeInProgressOperation}>Text</Button>
				<Button variant={'dangerous'} actionInProgress={this.state.inProgress} onClick={this.executeInProgressOperation}>Dangerous</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
    };
    private render_RandomTests = () => {
        return <TS_PropRenderer.Vertical label={'Random Tests'}>
			<LL_H_C className={'ats__button__buttons'}>
				<Button variant={'primary'} onClick={this.executeAsyncOperation}>K</Button>
				<Button variant={'primary'} onClick={this.executeAsyncOperation}>Long Text Test 123123123</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
    };
}
