type Proto<dbName extends string> = {
	dbName: dbName
}

type NonEmptyObject<T> = T extends object ? (keyof T extends never ? never : T) : never;

export type DotNotation<T extends object> =
	NonNullable<T extends object ? {
			[K in keyof T]: K extends string
				? T[K] extends object
					? NonEmptyObject<T[K]> extends never
						? T[K] extends string | string[] ? `${K & string}` : never
						: `${K & string}.${DotNotation<T[K]>}`
					: `${K & string}`
				: never;
		}[keyof T]
		: ''>;

type ProtoDependencies<T extends object> = { [K in DotNotation<T>]?: Proto<any> }

// type DependenciesX = ProtoDependencies<X> { dbName: Proto<any>['dbName'] }

type DependenciesValidator<T extends object, D extends ProtoDependencies<T>> = {
	[K in keyof D]: D[K] extends Proto<any> ? { dbName: D[K]['dbName'] } : never;
}

type ProtoDependenciesX = {
	'a.yId': DBProto_Y
}
type DependenciesValidatorX = DependenciesValidator<X, ProtoDependenciesX>

// @ts-ignore
type DBProto_X = Proto<'x'>;
type DBProto_Y = Proto<'y'>;
type X = {
	b: string
	a: {
		yId: string
	}
}

// @ts-ignore
type Y = {
	a: {
		yId: string
	}
}

// @ts-ignore
const pah: DependenciesValidatorX = {
	'a.yId': {dbName: 'y'}
};
