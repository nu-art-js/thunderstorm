import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BAIScreen} from './BAIScreen';
import {BeLogged, LogClient_Terminal, removeFromArrayByIndex} from '@nu-art/ts-common';
import {Phase} from '../phase';
import {dispatcher_PhaseChange, PhaseRunner_OnPhaseChange} from '../phase-runner/PhaseRunnerDispatcher';
import {MemKey_PhaseRunner} from '../phase-runner/consts';


export const MemKey_BAIScreenManager = new MemKey<BAIScreenManager>('bai-screen-manager');

type BAIScreenConditions = {
	startOnPhase?: Phase<string>;
	stopOnPhase?: Phase<string>;
	condition?: () => boolean
};

type BAIScreenOption = {
	screen: BAIScreen;
	conditions: BAIScreenConditions;
};

export class BAIScreenManager
	implements PhaseRunner_OnPhaseChange {

	readonly screens: BAIScreenOption[] = [];
	private currentPhase?: Phase<string>;
	private currentScreen?: BAIScreenOption;

	constructor() {
		dispatcher_PhaseChange.addListener(this);
		this.assignTerminal();
	}

	__onPhaseChange = (phase: Phase<string>) => {
		this.currentPhase = phase;
		this.reAssignScreen();
	};

	// ######################### Screens #########################

	public addScreen = (screen: BAIScreen, conditions: BAIScreenConditions) => {
		if (this.screens.find(op => op.screen === screen))
			return;

		this.screens.push({screen, conditions});
	};

	public removeScreen = (screen: BAIScreen) => {
		const index = this.screens.findIndex(op => op.screen === screen);
		if (index === -1)
			return;

		removeFromArrayByIndex(this.screens, index);
	};

	// ######################### Screen Transition Logic #########################

	private getScreenOption(): BAIScreenOption | undefined {
		const phases = MemKey_PhaseRunner.get().getPhases();
		const currentPhaseIndex = this.currentPhase ? phases.indexOf(this.currentPhase) : -1;
		return this.screens.find(screenOption => {
			if (screenOption.conditions.condition && !screenOption.conditions.condition())
				return false;

			const startPhaseIndex = screenOption.conditions.startOnPhase ? phases.indexOf(screenOption.conditions.startOnPhase) : phases.length;
			const stopPhaseIndex = screenOption.conditions.stopOnPhase ? phases.indexOf(screenOption.conditions.stopOnPhase) : phases.length;

			//Fail fast if current phase is before the startOnPhase
			if (currentPhaseIndex >= startPhaseIndex && currentPhaseIndex < stopPhaseIndex)
				return true;

			return false;
		});
	}

	private reAssignScreen() {
		const screenToAssign = this.getScreenOption();
		//No screen conditions pass
		if (!screenToAssign)
			return this.assignTerminal();

		this.assignScreenOption(screenToAssign);
	}

	private assignTerminal() {
		//Un assign current screen
		if (this.currentScreen) {
			this.currentScreen.screen.stopScreen();
		}

		BeLogged.addClient(LogClient_Terminal);
	}

	private assignScreenOption(screen: BAIScreenOption) {
		//No need to do anything if same screen
		if (this.currentScreen === screen)
			return;

		//Un assign current screen
		if (this.currentScreen) {
			this.currentScreen.screen.stopScreen();
		} else {
			//Remove terminal from the BeLogged
			BeLogged.removeClient(LogClient_Terminal);
		}

		//Assign given screen
		this.currentScreen = screen;
		this.currentScreen.screen.startScreen();
	}
}