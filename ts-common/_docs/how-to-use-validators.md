# How to: Validators

The `ts-common` validator system provides composable, type-safe runtime validation. It is used for module config validation, DB entity validation, API input validation, and anywhere you need to verify data shape at runtime.

All validators live under `@nu-art/ts-common` — imported from `validator/validator-core` (core types and engine) and `validator/type-validators` + `validator/validators` (built-in validators).

---

## Core concepts

### Validator

A `Validator<T>` is a single validation function or an array of functions. Each function receives the value and returns `undefined` (valid) or a string/object describing the error.

```typescript
type ValidatorImpl<P> = (p?: P, parentObj?: any) => InvalidResult<P> | undefined;
type Validator<P> = ValidatorImpl<P> | ValidatorImpl<P>[];
```

When a `Validator` is an array, all functions in the array must pass (they short-circuit on the first failure). The first function is typically an existence check (mandatory vs optional), and subsequent functions validate the value itself.

### TypeValidator

A `TypeValidator<T>` validates an object by mapping each property to its own validator:

```typescript
type TypeValidator<T> = { [P in keyof T]-?: ValidatorTypeResolver<T[P]> };
```

Every key in `T` must have a corresponding validator entry — this is enforced by the `-?` (required) modifier. If a property is optional at runtime, use an optional validator (e.g. `tsValidateOptionalAnyString`) for that key.

### ValidatorTypeResolver

The type system automatically picks the right validator shape based on the value type:

- **Primitives** (string, number, boolean) -> `Validator<T>`
- **Objects** -> `TypeValidator<T>` (per-property) or `Validator<T>` (whole-object)
- **Arrays** -> `Validator<T>`

---

## The mandatory parameter

Almost every built-in validator accepts a `mandatory` parameter (default: `true`).

- `mandatory = true` — the value must exist (not `null`/`undefined`). If missing, validation fails with `"Missing mandatory field"`.
- `mandatory = false` — if the value is `null`/`undefined`, validation passes immediately (skips further checks). If the value **does** exist, it is validated normally.

```typescript
tsValidateString()          // mandatory string
tsValidateString(-1, false) // optional string
tsValidateNumber()          // mandatory number
tsValidateNumber(false)     // optional number
```

---

## Built-in validators

### Primitive validators

| Validator | Validates | Notes |
|---|---|---|
| `tsValidateString(length?, mandatory?)` | string | `length`: max length, `[min, max]` range, or `-1` (no limit) |
| `tsValidateAnyString` | mandatory string, any length | Shorthand for `tsValidateString()` |
| `tsValidateOptionalAnyString` | optional string, any length | Shorthand for `tsValidateString(-1, false)` |
| `tsValidateStringMinLength(length, mandatory?)` | string with minimum length | |
| `tsValidateNumber(mandatory?)` | number | |
| `tsValidateAnyNumber` | mandatory number | Shorthand for `tsValidateNumber()` |
| `tsValidateOptionalAnyNumber` | optional number | Shorthand for `tsValidateNumber(false)` |
| `tsValidateBoolean(mandatory?)` | boolean | |
| `tsValidateMandatoryBoolean` | mandatory boolean | Shorthand for `tsValidateBoolean()` |
| `tsValidateOptionalBoolean` | optional boolean | Shorthand for `tsValidateBoolean(false)` |

### Enum and value validators

| Validator | Validates | Notes |
|---|---|---|
| `tsValidateEnum(enumType, mandatory?)` | value exists in a TypedMap enum | |
| `tsValidateValue(values, mandatory?)` | value is one of an array of allowed values | Works with any type |

### Existence validators

| Validator | Validates | Notes |
|---|---|---|
| `tsValidateExists(mandatory?)` | value is not null/undefined | Building block for other validators |
| `tsValidateMustExist` | value must exist | Shorthand for `tsValidateExists()` |
| `tsValidateOptional` | value may be missing | Shorthand for `tsValidateExists(false)` — use in `TypeValidator` for keys you want to ignore |

### Pattern validators

| Validator | Validates | Notes |
|---|---|---|
| `tsValidateRegexp(regexp, mandatory?)` | string matches a regex | |
| `tsValidateEmail` | email format | |
| `tsValidateIpAddress(mandatory?)` | IPv4 or IPv6 | |
| `tsValidateVersion` | semantic version (X.Y.Z) | |
| `tsValidateUniqueId` | 32-char hex ID | |
| `tsValidateMD5(mandatory?)` | 32-char hex (MD5 format) | |
| `tsValidateGeneralUrl(mandatory?)` | HTTPS URL | |
| `tsValidateBucketUrl(mandatory?)` | gs:// or s3:// URL | |
| `tsValidateShortUrl(mandatory?)` | 8-char short URL ID | |
| `tsValidator_colorHex` | hex color (#RGB, #RGBA, #RRGGBB, #RRGGBBAA) | |

### Numeric range and timestamp validators

| Validator | Validates | Notes |
|---|---|---|
| `tsValidateIsInRange(ranges, mandatory?)` | number falls in one of the given `[min, max]` ranges | |
| `tsValidateRange(mandatory?)` | a `[number, number]` tuple where min <= max | |
| `tsValidateTimestamp(interval?, mandatory?)` | timestamp within `interval` ms of now | No interval = any past timestamp |
| `tsValidateTimeRange(mandatory?)` | a `TimeRange` (1- or 2-element array of timestamps) | |

### Composite validators

#### Arrays

```typescript
tsValidateArray(elementValidator, mandatory?, minimumLength?, strict?)
```

Validates each element using `elementValidator`. Optional minimum array length.

```typescript
// mandatory array of strings
tsValidateArray(tsValidateAnyString)

// optional array of numbers, at least 2 elements
tsValidateArray(tsValidateNumber(), false, 2)

// shorthand for optional array
tsValidate_OptionalArray(tsValidateAnyString)
```

#### Objects (nested)

For nested objects, use a `TypeValidator`:

```typescript
type Address = {
	street: string;
	city: string;
	zip?: string;
};

const addressValidator: TypeValidator<Address> = {
	street: tsValidateAnyString,
	city: tsValidateAnyString,
	zip: tsValidateOptionalAnyString,
};
```

Then use it inside a parent validator directly — the type system resolves object-typed properties to `TypeValidator` automatically:

```typescript
type Person = {
	name: string;
	age: number;
	address: Address;
};

const personValidator: TypeValidator<Person> = {
	name: tsValidateAnyString,
	age: tsValidateNumber(),
	address: addressValidator,
};
```

#### Optional nested objects

When a nested object is itself optional, wrap the validator:

```typescript
tsValidateOptionalObject(addressValidator)
// alias: tsValidateNonMandatoryObject(addressValidator)
```

#### Dynamic objects (key-value maps)

```typescript
tsValidateDynamicObject(valuesValidator, keysValidator, mandatory?)
```

Validates both keys and values of an object where keys are not known at compile time:

```typescript
// { [string]: number }
tsValidateDynamicObject(tsValidateNumber(), tsValidateAnyString)
```

#### Union types

When a value can be one of several types, use union validators:

```typescript
// value must pass at least one validator
tsValidateUnion([tsValidateAnyString, tsValidateNumber()])

// shorthand for string | number
tsValidator_stringOrNumber(mandatory?)
```

`tsValidateUnionV3` dispatches by `typeof` for more efficient validation:

```typescript
tsValidateUnionV3({
	string: tsValidateAnyString,
	number: tsValidateNumber(),
})
```

#### Arrays of polymorphic objects

When an array contains objects of different "types" distinguished by a key:

```typescript
tsValidator_ArrayOfObjectsByKey('type', {
	circle: circleValidator,
	square: squareValidator,
})
```

Each element's `type` field determines which validator is applied.

#### Value-by-key (polymorphic field)

When a single field's validator depends on a sibling field's value:

```typescript
tsValidator_valueByKey({
	email: tsValidateEmail,
	phone: tsValidator_InternationalPhoneNumber,
}, 'contactType')
```

The value of `contactType` on the parent object determines which validator is used.

---

## Custom validators

For logic that no built-in covers, use `tsValidateCustom`:

```typescript
tsValidateCustom<number>((input?, parentInput?) => {
	if (input !== undefined && input < 0)
		return 'Value must be non-negative';

	return undefined; // valid
}, mandatory)
```

The second argument (`parentInput`) gives access to the enclosing object — useful when validation depends on sibling fields.

---

## Running validation

### tsValidateResult — non-throwing

```typescript
const result = tsValidateResult(value, validator);
// result is undefined (valid) or an InvalidResult describing errors
```

### tsValidate — strict (throws)

```typescript
tsValidate(value, validator);          // throws ValidationException on failure
tsValidate(value, validator, false);   // returns result, does not throw
```

`ValidationException` extends `CustomException` and carries both the original `input` and the detailed `result` object.

### Strict mode and unexpected keys

When validating objects in strict mode (default), keys present in the instance but **not** in the `TypeValidator` are reported as errors. To allow extra keys, add `tsValidateOptional` for those keys in the validator, or pass `strict = false`.

---

## Putting it together — module config example

```typescript
type Config = {
	enabled: boolean;
	maxRetries: number;
	endpoint: string;
	tags?: string[];
};

const configValidator: TypeValidator<Config> = {
	enabled: tsValidateMandatoryBoolean,
	maxRetries: tsValidateNumber(),
	endpoint: tsValidateAnyString,
	tags: tsValidate_OptionalArray(tsValidateAnyString),
};
```

Pass this to `this.setConfigValidator(configValidator)` in the module constructor. See [how-to-use-module-config.md](how-to-use-module-config.md) for the full module config pattern.
