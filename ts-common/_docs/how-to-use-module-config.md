# How to: Module Configuration

Modules extend `Module<Config>` from `ts-common`. The `Config` generic defines the shape of runtime configuration the module accepts. Configuration is injected by the `ModuleManager` at startup and deep-merged with any defaults you set.

## Pattern

Every configurable module follows three steps in its constructor:

1. **Define a `Config` type** — the shape of what the module needs at runtime.
2. **Provide a `defaultConfig`** — sensible defaults so the module works without external config.
3. **Provide a `configValidator`** — a `TypeValidator<Config>` that validates the merged config at startup (fail-fast).

```typescript
import {Module} from '@nu-art/ts-common';
import {tsValidateAnyString, tsValidateMandatoryBoolean, tsValidateNumber} from '@nu-art/ts-common';

type Config = {
	enabled: boolean;
	maxRetries: number;
	endpoint: string;
};

const defaultConfig: Config = {
	enabled: true,
	maxRetries: 3,
	endpoint: 'https://api.example.com',
};

const configValidator = {
	enabled: tsValidateMandatoryBoolean,
	maxRetries: tsValidateNumber(),
	endpoint: tsValidateAnyString,
};

export class ModuleBE_Example_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig(defaultConfig);
		this.setConfigValidator(configValidator);
	}

	protected init() {
		if (!this.config.enabled)
			return;

		// use this.config.maxRetries, this.config.endpoint, etc.
	}
}

export const ModuleBE_Example = new ModuleBE_Example_Class();
```

## How config flows

1. **Constructor** — `setDefaultConfig(defaultConfig)` seeds `this.config` with your defaults.
2. **ModuleManager.init()** — The manager looks up external config by module name (class name minus `_Class`, e.g. `ModuleBE_Example`) and deep-merges it into `this.config`. Only the keys provided externally override the defaults — deep merge handles the rest. How external config is fed to `ModuleManager` is outside the scope of `ts-common` — that is the responsibility of the project or framework layer above.
3. **init()** — By the time `init()` runs, `this.config` is the merged result. If a config validator was set, the merged config is validated and invalid values will throw at startup.

## minLogLevel

Every module config implicitly supports `minLogLevel` (from `LogLevel` enum). If set, the module's logger minimum level is updated automatically during config injection. You do not need to declare it in your `Config` type — it is handled by the base `Module` class.

## When to use a config validator

Always. The validator ensures bad config is caught at startup rather than causing mysterious runtime failures. If the module has config, it should have a validator.

For how to construct validators, see [how-to-use-validators.md](how-to-use-validators.md).
