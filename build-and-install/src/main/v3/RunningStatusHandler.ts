import fs, {promises as _fs} from 'fs';
import {__stringify, Logger} from '@nu-art/ts-common';
import {BaiParams} from '../core/params/params.js';


/**
 * Manages execution state persistence for resume support.
 * 
 * **Purpose**: Enables `--continue` flag to resume from last completed step.
 * 
 * **State Management**:
 * - **startIndex**: Current step index (0-based)
 * - **completedUnits**: Units completed in current step
 * - **runtimeParams**: Runtime parameters (for state validation)
 * 
 * **Persistence**:
 * - Saves state to `.trash/output/running-status.json` after each step/unit
 * - Loads state on init if `--continue` flag is set
 * - State includes: index, runtimeParams, completedUnits
 * 
 * **Isolation Mode**: When isolated, skips saving state (useful for tests).
 * 
 * **Usage Flow**:
 * 1. `init()` - Loads state if `--continue`
 * 2. `onStepStarted()` - Saves current step index
 * 3. `onUnitCompleted()` - Marks unit as completed, saves state
 * 4. `onStepEnded()` - Clears completed units for next step
 * 5. `isCompleted()` - Checks if unit already completed (for resume)
 */
export class RunningStatusHandler
	extends Logger {

	private isolated = false;
	private readonly outputFolder: string;

	// The completed units in the phase.. when running -con, these can be skipped
	private completedUnits: string[] = [];
	runtimeParams: BaiParams;
	startIndex: number = 0;

	constructor(outputFolder: string, runtimeParams: BaiParams) {
		super();
		this.outputFolder = outputFolder;
		this.runtimeParams = runtimeParams;
	}

	/**
	 * Initializes the status handler.
	 * 
	 * **Actions**:
	 * - Creates output folder if missing
	 * - Loads saved state if `--continue` flag is set
	 * - Merges loaded runtime params with current params (loaded params take precedence)
	 */
	async init() {
		if (!fs.existsSync(this.outputFolder))
			await _fs.mkdir(this.outputFolder, {recursive: true});

		if (this.runtimeParams.continue) {
			const currentParams = this.runtimeParams;
			this.startIndex = await this.load();
			this.runtimeParams = Object.assign(currentParams, this.runtimeParams);
		}
	}

	/**
	 * Enables isolation mode (skips saving state).
	 * 
	 * Useful for tests or when state persistence is not desired.
	 * 
	 * @returns This instance for chaining
	 */
	isolate(): RunningStatusHandler {
		this.isolated = true;
		return this;
	}

	/**
	 * Checks if a unit has already been completed (for resume).
	 * 
	 * @param unitKey - Unit key to check
	 * @returns True if unit is marked as completed
	 */
	isCompleted(unitKey: string) {
		return this.completedUnits.includes(unitKey);
	}

	/**
	 * Marks a unit as completed and saves state.
	 * 
	 * Called after a unit successfully completes all its phases.
	 * 
	 * @param unitKey - Unit key that completed
	 */
	async onUnitCompleted(unitKey: string) {
		this.logDebug(`On unit completed: ${unitKey}`);
		this.completedUnits.push(unitKey);
		await this.saveStatus();
	}

	/**
	 * Called when a step completes successfully.
	 * 
	 * Clears completed units list for the next step.
	 */
	async onStepEnded() {
		this.logDebug(`On step ended successfully #${this.startIndex}`);
		this.completedUnits = [];
	}

	/**
	 * Called when a step starts.
	 * 
	 * Updates start index and saves state (unless isolated).
	 * 
	 * @param index - Step index (0-based)
	 */
	async onStepStarted(index: number) {
		this.startIndex = index;
		this.logDebug(`Setting execution index to #${this.startIndex}`);
		if (this.isolated)
			return;

		await this.saveStatus();
	}

	/**
	 * Saves current state to disk.
	 * 
	 * Writes to `.trash/output/running-status.json` with:
	 * - Current step index
	 * - Runtime params (for validation)
	 * - Completed units in current step
	 * 
	 * Called after each step start and unit completion.
	 */
	private async saveStatus() {
		await _fs.writeFile(`${this.outputFolder}/running-status.json`, __stringify({
			index: this.startIndex,
			runtimeParams: this.runtimeParams,
			completedUnits: this.completedUnits
		}, true));
	}

	/**
	 * Loads saved state from disk.
	 * 
	 * **Behavior**:
	 * - Reads from `.trash/output/running-status.json`
	 * - Restores step index, completed units, and runtime params
	 * - Returns undefined if file doesn't exist or parse fails (logs error)
	 * 
	 * **Note**: Runtime params from file override current params (for consistency).
	 * 
	 * @returns Promise resolving to step index, or undefined if load fails
	 */
	async load() {
		try {
			const data = JSON.parse(await _fs.readFile(`${this.outputFolder}/running-status.json`, {encoding: 'utf-8'}));
			this.startIndex = data.index;
			this.completedUnits = data.completedUnits ?? [];
			this.runtimeParams = data.runtimeParams;
			return data.index;
		} catch (e: any) {
			this.logError('Failed reading running status, using initial status', e);
			return;
		}
	}
}