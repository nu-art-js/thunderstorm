/*
 * Testelot is a typescript scenario composing framework
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by TacB0sS on 3/18/17.
 */
import {
	currentTimeMillies,
	generateUUID,
	Logger,
	timeout,
	Void,
	Constructor,
	isErrorOfType,
	__stringify
} from "@nu-art/ts-common";
import {ContextKey} from "./ContainerContext";
import {Reporter} from "./Reporter";
import {TestException} from "./TestException";

export enum Status {
	Ready   = "Ready",
	Running = "Running",
	Skipped = "Skipped",
	Success = "Success",
	Error   = "Error"
}

export const enum ErrorPolicy {
	ContinueOnError,
	SkipOnError,
	HaltOnError,
}

export type ShouldFailCondition<T extends Error> = (e: T) => boolean;

export type ReturnValueProcessor<ReturnValue extends any = any> = (returnValue?: ReturnValue) => void;

export abstract class Action<ParamValue extends any = any, ReturnValue extends any = any>
	extends Logger {
	private static testsToRun: string[] = [];

	readonly actionType: string;

	readonly uuid: string = generateUUID();
	protected writeKey!: ContextKey<ReturnValue>;
	private readKey!: ContextKey<ParamValue>;
	private parent!: Action<any>;
	protected reporter!: Reporter;

	private label?: string | ((param?: ParamValue) => string) = "Unnamed Action";
	public policy: ErrorPolicy = ErrorPolicy.SkipOnError;
	private _started!: number;
	private _ended!: number;
	private postExecutionDelay: number = 0;

	public status: Status = Status.Ready;

	private shouldFailCondition?: ShouldFailCondition<any>;
	private assertFailCondition?: ReturnValueProcessor<ReturnValue>;

	protected constructor(actionType: Function, tag?: string) {
		super(tag || "Testelot");

		this.actionType = actionType.name;
	}

	static resolveTestsToRun() {
		let strings = process.argv.filter((arg: string) => arg.includes("--test="));
		console.log(`raw: ${__stringify(strings)}`);

		this.testsToRun = strings.map(arg => arg.replace("--test=", ""));
		console.log(`Tests to run: ${__stringify(this.testsToRun)}`);
	}

	expectToFail<T extends Error>(_exceptionType: Constructor<T>, assertFailCondition?: ShouldFailCondition<T>) {
		this.shouldFailCondition = (e: Error): boolean => {
			const err = isErrorOfType(e, _exceptionType);
			if (!err)
				throw new TestException(`Test should have failed with an: ${_exceptionType.name}`);

			return !assertFailCondition ? true : assertFailCondition(err);
		};
		return this;
	}

	processReturnValue(returnValueProcessor: ReturnValueProcessor<ReturnValue>) {
		this.assertFailCondition = returnValueProcessor;
		return this;
	}

	isContainer() {
		return false;
	}

	public hasParent() {
		return !!this.parent;
	}

	public setErrorPolicy(policy: ErrorPolicy) {
		this.policy = policy;
		return this;
	}

	protected setParent(parent: Action<any>) {
		this.parent = parent;
	}

	protected setReporter(reporter: Reporter) {
		this.reporter = reporter;
	}

	setWriteKey(writeKey: ContextKey<ReturnValue>) {
		this.writeKey = writeKey;
		return this;
	}

	setReadKey(readKey: ContextKey<ParamValue>) {
		this.readKey = readKey;
		return this;
	}

	setPostExecutionDelay(postExecutionDelay: number) {
		this.postExecutionDelay = postExecutionDelay;
		return this;
	}

	public setLabel(label?: string | ((param?: ParamValue) => string)) {
		this.label = label;
		return this;
	}

	getStarted() {
		return this._started;
	}

	getEnded() {
		return this._ended;
	}

	protected async _executeSubAction(action: Action) {
		action.setParent(this);
		action.setReporter(this.reporter);

		await action._execute();
	}

	protected resolveLabel(param?: ParamValue) {
		if (!this.label)
			return;

		return typeof this.label === "string" ? this.label : this.label(param);
	}

	private async _execute() {
		this._started = currentTimeMillies();

		let label: string | undefined;
		let err;
		let retValue: ReturnValue | undefined = undefined;
		try {
			let param;
			if (this.readKey)
				param = this.get(this.readKey);

			label = this.resolveLabel(param);
			if (Action.testsToRun.length > 0 && !Action.testsToRun.find(testToRun => (label || "").includes(testToRun)))
				this.setStatus(Status.Skipped);
			else
				this.setStatus(Status.Ready);

			if (this.status === Status.Skipped) {
				if (this.isContainer())
					// @ts-ignore
					await this.execute();

				label && this.reporter.logVerbose(`skipped: ${label}`);
				this.reporter.onActionEnded(this);
				this._ended = currentTimeMillies();
				return;
			}

			if (this.isContainer())
				label && this.reporter.logVerbose(`+ ${label}`);
			else {
				label && this.reporter.logVerbose(`Running: ${label}`);
				if (this.readKey)
					this.reporter.logDebug(`Using context: ${this.readKey.key}`);
			}

			this.reporter.onActionStarted(this);
			this.setStatus(Status.Running);

			retValue = await this.execute((param || Void) as ParamValue);
		} catch (e) {
			err = this.shouldFailCondition?.(e) ? undefined : e;
		} finally {
			if (this.status !== Status.Skipped) {
				this.setStatus(err ? Status.Error : Status.Success);
				this.reporter.onActionEnded(this);
				if (err) {
					label && this.reporter.logError(`Error in Action: ${label}`);
					this.reporter.logError(err);
				} else {
					// only set the ret value if we expect a success...
					if (this.writeKey && !this.shouldFailCondition) {
						this.set(this.writeKey, retValue);
					}
					this.assertFailCondition?.(retValue);


					// label && this.reporter.logVerbose(`ended: ${label}`);
					if (this.isContainer())
						label && this.reporter.logVerbose(`- ${label}`);
				}
			}
		}

		if (this.postExecutionDelay > 0)
			await timeout(this.postExecutionDelay);

		this._ended = currentTimeMillies();
	}

	setStatus(status: Status) {
		this.status = status;
	}

	protected abstract async execute(param: ParamValue): Promise<ReturnValue>;

	public get<ValueType>(key: ContextKey<ValueType>): ValueType | undefined {
		if (!this.parent)
			return key.defaultValue;

		return this.parent.get(key);
	}

	protected remove<ValueType>(key: ContextKey<ValueType>): boolean {
		if (!this.parent)
			return false;

		return this.parent.remove(key);
	}

	public set<ValueType>(key: ContextKey<ValueType>, value: ValueType): ValueType | undefined {
		if (!this.parent)
			return;

		return this.parent.set(key, value);
	}

	reset() {
		//
	}
}