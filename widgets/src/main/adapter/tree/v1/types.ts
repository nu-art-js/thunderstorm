export type NodeExpandCondition = (key: string, value: any, level: number, path: string) => boolean | undefined;

export type TreeNodeExpandState = { [path: string]: true | undefined };
