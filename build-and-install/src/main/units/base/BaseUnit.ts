import {
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	AsyncVoidFunction,
	BeLogged,
	Constructor,
	exists,
	lastElement,
	LogClient_MemBuffer,
	Logger,
	LogLevel,
	removeItemFromArray,
	TimeCounter,
	timeCounter
} from '@nu-art/ts-common';
import {CommandoInteractive} from '@nu-art/commando';
import {BaseCommando} from '@nu-art/commando';
import {MergeTypes} from '@nu-art/commando';
import {CommandoPool} from '@nu-art/commando';
import {Commando_Basic} from '@nu-art/commando';
import {BAI_Config} from '../../config/types/project-config.js';
import {UnitsDependencyMapper} from '../../dependencies/UnitsDependencyMapper.js';
import {BaiParams} from '../../core/params.js';
import {Workspace} from '../../workspace/Workspace.js';


/**
 * Base configuration for all units.
 */
export type BaseUnit_Config = {
	key: string;
	label: string;
	isTopLevelApp?: boolean;
}

/**
 * Runtime context provided to all units during execution.
 *
 * Contains version, config, dependency mapper, runtime params, and workspace reference.
 */
export type UnitRuntimeContext = {
	version: string
	baiConfig: Readonly<BAI_Config>,
	unitsMapper: UnitsDependencyMapper,
	unitsResolver: <Class extends BaseUnit>(keys: string[], className: Constructor<Class>) => Class[],
	runtimeParams: BaiParams
	globalOutputFolder: string
	workspace?: Workspace;  // Optional workspace reference for advanced queries
};

/**
 * Base class for all units in the build system.
 *
 * **Unit Lifecycle**:
 * 1. **Discovery**: Units are discovered by UnitsMapper from file system
 * 2. **Initialization**: Constructor sets up config and logging
 * 3. **Context Setup**: `setupRuntimeContext()` provides runtime information
 * 4. **Phase Execution**: Phases call unit methods (e.g., `compile()`, `test()`)
 * 5. **Termination**: `kill()` stops all running processes
 *
 * **Key Features**:
 * - **Commando Integration**: Allocates Commando instances for shell commands
 * - **Process Management**: Tracks and kills subprocesses on termination
 * - **Logging**: Buffered logging with status tracking
 * - **Time Tracking**: Measures operation duration
 *
 * **Phase Methods**: Units implement phase methods (e.g., `prepare()`, `compile()`, `test()`)
 * that are called by PhaseManager. Methods are discovered via reflection.
 *
 * **Status Tracking**: Units track their status ('Pending Initialization', 'Running', etc.)
 * for monitoring and debugging.
 */
export abstract class BaseUnit<C extends BaseUnit_Config = BaseUnit_Config, RT_Context extends UnitRuntimeContext = UnitRuntimeContext>
	extends Logger {

	readonly config: Readonly<C>;
	private unitStatus: string = 'Pending Initialization';
	protected logger!: LogClient_MemBuffer;
	private readonly classStack: string[] = [];
	private processTerminator: AsyncVoidFunction[] = [];
	private timeCounter?: TimeCounter;
	protected runtimeContext!: RT_Context;

	protected constructor(config: C) {
		super(config.key);
		this.config = Object.freeze(config);
		this.addToClassStack(BaseUnit);
		this.initLogClient();
	}

	setupRuntimeContext(runtimeContext: RT_Context) {
		this.runtimeContext = runtimeContext;
	}

	registerTerminatable(terminatable: AsyncVoidFunction) {
		this.processTerminator.push(terminatable);
	}

	unregisterTerminatable(terminatable: AsyncVoidFunction) {
		removeItemFromArray(this.processTerminator, terminatable);
	}

	allocateCommando<T extends Constructor<any>[]>(...plugins: T): MergeTypes<[...T]> & CommandoInteractive & BaseCommando & Commando_Basic {
		return CommandoPool.allocateCommando(this.config.key, ...plugins);
	}

	async executeAsyncCommando<T>(commando: CommandoInteractive, command: string, callback?: (stdout: string, stderr: string, exitCode: number) => T) {
		let pid: number;

		const terminatable = () => commando.killSubprocess(pid);
		try {
			this.registerTerminatable(terminatable);
			return await commando
				.appendAsync(command, _pid => pid = _pid)
				.execute(callback);
		} finally {
			this.unregisterTerminatable(terminatable);
		}
	}

	async executeCommando<T>(commando: CommandoInteractive, action: (commando: CommandoInteractive) => Promise<T>) {
		const terminatable = () => {
			this.logError('KILLLLLLING');
			return commando.kill();
		};
		try {
			this.registerTerminatable(terminatable);
			return action(commando);
		} finally {
			this.unregisterTerminatable(terminatable);
		}
	}

	//######################### Internal Logic #########################

	private initLogClient() {
		this.logger = new LogClient_MemBuffer(this.tag);
		this.logger.keepLogsNaturalColors();
		this.logger.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `${date} ${_logger_getPrefix(level)}:  `;
		});

		this.logger.setFilter((level, tag) => {
			return tag === this.tag;
		});
		BeLogged.addClient(this.logger);
	}

	protected setErrorStatus(status: string, error: Error) {
		this.setStatus(status, 'end', LogLevel.Error);
		this.logError(error);
	}

	protected setStatus(status: string, type?: 'start' | 'end', logLevel: LogLevel = LogLevel.Info) {
		let operationDuration: string | undefined = '';
		if (type === 'start')
			this.timeCounter = timeCounter();

		if (type === 'end')
			if (!exists(this.timeCounter))
				this.logError(`Got end status: '${status}' - while current status '${this.unitStatus}' was not a start`);
			else {
				const s = this.timeCounter.format('mm:ss');
				if (s !== '00:00')
					operationDuration = ` (${s})`;
				delete this.timeCounter;
			}

		this.log(logLevel, false, [`Unit status update: ${this.unitStatus} => ${status}${operationDuration}`]);
		this.unitStatus = `${status}${operationDuration}`;
	}

	protected addToClassStack = (cls: Function) => {
		this.classStack.push(cls.name);
	};

	public isInstanceOf = (cls: Function) => {
		return this.classStack.includes(cls.name);
	};

	public isInstanceType = (cls: Function) => {
		return lastElement(this.classStack) === cls.name;
	};

	public getStatus() {
		return this.unitStatus;
	}

	public async kill() {
		if (!this.processTerminator.length)
			return this.setStatus('Killed');

		const processTerminator = [...this.processTerminator];
		this.processTerminator.length = 0;
		this.setStatus('Killing');
		try {
			await Promise.all(processTerminator.map(toTerminate => toTerminate()));
		} finally {
			this.setStatus('Killed');
		}
	}

	public getLogs() {
		return this.logger.buffers[0];
	}
}