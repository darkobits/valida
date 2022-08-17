<img src="https://user-images.githubusercontent.com/441546/130314776-9eb98ab5-a9f6-4ba0-ae08-4488f98f976f.png" style="max-width: 100%" />
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/valida"><img src="https://img.shields.io/npm/v/@darkobits/valida.svg?style=flat-square&color=398AFB"></a>
  <a href="https://github.com/darkobits/valida/actions?query=workflow%3Aci"><img src="https://img.shields.io/github/workflow/status/darkobits/valida/ci/master?style=flat-square"></a>
  <a href="https://app.codecov.io/gh/darkobits/valida/branch/master"><img src="https://img.shields.io/codecov/c/github/darkobits/valida/master?style=flat-square&color=brightgreen"></a>
  <a href="https://depfu.com/github/darkobits/valida"><img src="https://img.shields.io/depfu/darkobits/valida?style=flat-square"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/static/v1?label=commits&message=conventional&style=flat-square&color=398AFB"></a>
</p>

<br />

Options validator using [`ow`](https://github.com/sindresorhus/ow).

# Features

* If used with a type argument, validates the provided `ow` spec against the provided type, ensuring
  that your runtime type checking stays in sync with your compile-time type-checking.
* If used without a type argument, ensures that validated values conform to the shape of the provided
  `ow` spec.
* Uses Levenshtein distance to suggest correct names for misspelled keys (a-la Jest, Babel).
* Allows for optional defaults to be specified, which are merged with user input before validation.

## Install

```
npm install @darkobits/valida
```

## Use

```ts
import createValidator from '@darkobits/valida';

interface Person {
  name: string;
  address: {
    street: string;
    locality: string;
    postalCode: string;
    administrativeArea: string;
    countryCode?: string;
  }
  age: number;
}

/**
 * - Pass a function to `createValidator`. This function will be invoked with a
 *   context object containing an `ow` reference.
 * - By default, `validate` will try to return the right shape based on your
 *   spec object, but if you need to be precise, provide a type argument to
 *   `createValidator` with your expected return type.
 */
const validate = createValidator<Person>(({ ow }) => ({
  /**
   * - Return an object containing a `spec` property and an optional `defaults`
   *   property.
   * - Note: Validation will take place _after_ defaults have been merged with
   *   user-provided data, so any fields for which you provide defaults should
   *   not use the `optional` predicate. You can, however, mark those fields as
   *   optional in your type defs so the user doesn't yelled-at if they omit a
   *   field with a default value.
   */
  spec: {
    name: ow.string,
    address: ow.object.exactShape({
      street: ow.string,
      locality: ow.string,
      postalCode: ow.string.numerical,
      administrativeArea: ow.string,
      countryCode: ow.string.maxLength(2)
    }),
    age: ow.number.positive
  },
  defaults: {
    address: {
      countryCode: 'GB'
    }
  }
}));

// - `person` will be of type `Person`
// - `address.CountryCode` will be merged-in.
const person = validate({
  name: 'Ervin Howell',
  address: {
    street: '692 Victor Plains',
    locality: 'Gwenborough',
    postalCode: '44932',
    administrativeArea: 'Chestertonshire',
  }
});

// This will throw; postalCode is non-numeric.
const person = validate({
  name: 'Ervin Howell',
  address: {
    street: '692 Victor Plains',
    locality: 'Gwenborough',
    postalCode: 'kittens',
    administrativeArea: 'Chestertonshire',
  }
});
```

## See Also

* [`ow`](https://github.com/sindresorhus/ow)

<br />
<a href="#top">
  <img src="https://user-images.githubusercontent.com/441546/102322726-5e6d4200-3f34-11eb-89f2-c31624ab7488.png" style="max-width: 100%;">
</a>
