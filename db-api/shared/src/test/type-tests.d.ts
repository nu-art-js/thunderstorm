import { TypeOfTypeAsString } from '../main/index.js';
export type test = TypeOfTypeAsString<DotNotationValueType<{
    a?: {
        b?: string;
    };
}, 'a.b'>>;
