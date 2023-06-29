"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_Object_Metadata = void 0;
exports.DB_Object_Metadata = {
    _id: { optional: false, valueType: 'string', description: 'unique key' },
    _v: { optional: false, valueType: 'string', description: 'version' },
    __created: { optional: false, valueType: 'number', description: 'timestamp of creation' },
    __updated: { optional: false, valueType: 'number', description: 'timestamp of last time modified' }
};
const pah = {
    a: { optional: false, description: 'aaa', valueType: 'string' },
    b: { optional: true, description: 'aaa', valueType: 'number' },
    c: { optional: true, description: 'harti barti', valueType: 'array', metadata: { optional: false, description: 'aaa', valueType: 'string' } },
    d: {
        optional: true,
        description: 'harti barti',
        valueType: 'object',
        metadata: { k: { optional: false, description: 'aaa', valueType: 'string' }, l: { optional: false, description: 'aaa', valueType: 'number' } }
    },
    e: { optional: true, description: 'harti barti', valueType: 'object', metadata: { ashpa: { optional: false, description: 'aaa', valueType: 'string' } } }
};
//# sourceMappingURL=types.js.map