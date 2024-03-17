import {CreateMergedInstance} from './class-merger';


class A {
	a() {
		console.log('Method a from Class A');
	}
}

class B {
	b() {
		console.log('Method b from Class B');
	}
}

class C {
	c() {
		console.log('Method c from Class C');
	}
}

const instance = CreateMergedInstance(A, B, C);
instance.a(); // Method a from Class A
instance.b(); // Method b from Class B
instance.c(); // Method b from Class C
