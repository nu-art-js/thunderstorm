import {randomBytes} from "crypto";
import {generateHex, TypedMap} from "../../../main";


function createArray() {
    const arr: string[] = []
    for (let i = 0; i < 1000000; i++) {
        arr[i] = generateHex(100)
    }
    return arr
}

function testObjectPerformance(array: string[]) {
    const obj: TypedMap<number> = {};
    const startTime = Date.now();


    for (let i = 0; i < 1000000; i++) {
        obj[array[i]] = i;
    }


    for (let i = 0; i < 1000000; i++) {
        const found = obj[array[i]]
    }


    for (let i = 0; i < 1000000; i++) {
        delete obj[array[i]];
    }

    const endTime = Date.now();
    console.log(`Time to complete object: ${endTime - startTime} milliseconds`);
}


function testMapPerformance(array: string[]) {
    const map = new Map();
    const startTime = Date.now();


    for (let i = 0; i < 1000000; i++) {
        map.set(array[i], i);
    }


    for (let i = 0; i < 1000000; i++) {
        const found = map.get(array[i])
    }

    for (let i = 0; i < 1000000; i++) {
        map.delete(array[i]);
    }

    const endTime = Date.now();
    console.log(`Time to complete hashMap: ${endTime - startTime} milliseconds`);
}

console.log("starting")
const arr: string[] = createArray()
testObjectPerformance(arr);
testMapPerformance(arr);
testObjectPerformance(arr);
testMapPerformance(arr);
console.log("---------------")

testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);
testMapPerformance(arr);


testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
testObjectPerformance(arr);
console.log("end")

