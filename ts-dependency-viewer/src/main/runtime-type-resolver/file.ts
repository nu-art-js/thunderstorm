type Shared = {
	zevel: string
	zevel2: number
};


type MyType1<K extends string> = {
	genericProp1: K
}

type MyType2<T extends Shared> = {
	genericProp2: T
}

type MyType3<T extends { gParam: string }> = {
	genericProp3: T
}

type MyType4<T extends { gParam: Shared }> = {
	genericProp4: T
}

type MyType5 = {
	func: (kaki: number) => boolean
	ashpa: Shared
}
