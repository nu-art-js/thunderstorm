// mime-module.d.ts to fix broken mime import
declare module 'mime' {
	const anyType: any;
	export = anyType;
}