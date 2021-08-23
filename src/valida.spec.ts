/* eslint-disable import/first, import/order */
import { expectTypeOf } from 'expect-type';
import type { BasePredicate } from 'ow';
import type { DeepPartial } from 'ts-essentials';

import { ShapeFor, DefaultsFor, PredicateFor } from 'etc/types';

import createValidator from './valida';


describe('types', () => {
  describe('PredicateFor / ShapeFor / DefaultsFor', () => {
    it('should perform inverse operations', () => {
      interface MyObjType {
        a: string;
        b: {
          b: number;
        };
      }

      // Creating a Predicate of a type should result in a sub-type of
      // BasePredicate.
      type Predicate = PredicateFor<MyObjType>;
      expectTypeOf<Predicate>().toMatchTypeOf<BasePredicate>();

      // Creating a ShapeFor of a Predicate type should result in the original
      // shape.
      type Shape = ShapeFor<Predicate>;
      expectTypeOf<Shape>().toMatchTypeOf<MyObjType>();

      // Creating a Defaults of a Predicate type should return a deeply nullable
      // shape.
      type Defaults = DefaultsFor<Predicate>;
      expectTypeOf<Defaults>().toMatchTypeOf<DeepPartial<MyObjType>>();
    });
  });

  describe('type inference', () => {
    interface TestObj {
      a: string;
      b: number;
      c?: boolean;
    }

    it('should infer a shape from the provided spec', () => {
      const validateWithoutGeneric = createValidator(({ ow }) => {
        return {
          spec: {
            a: ow.string,
            b: ow.number,
            c: ow.optional.boolean
          }
        };
      });

      const resultWithoutGeneric = validateWithoutGeneric({
        a: 'a',
        b: 1,
        c: false
      });

      expectTypeOf<typeof resultWithoutGeneric>().toMatchTypeOf<TestObj>();
    });

    it('should infer a shape from the provided spec', () => {
      const validateWithGeneric = createValidator<TestObj>(({ ow }) => {
        return {
          spec: {
            a: ow.string,
            b: ow.number,
            c: ow.optional.boolean
          }
        };
      });

      const resultWithGeneric = validateWithGeneric({
        a: 'a',
        b: 1,
        c: false
      });

      expectTypeOf<typeof resultWithGeneric>().toMatchTypeOf<TestObj>();
    });
  });
});

describe('invalid invocations', () => {
  describe('not providing a function', () => {
    it('should throw', () => {
      expect(() => {
        // @ts-expect-error
        createValidator();
      }).toThrow('Expected `argument` to be of type `Function` but received type `undefined`.');
    });
  });

  describe('not returning a value', () => {
    it('should throw', () => {
      expect(() => {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        createValidator(() => {});
      }).toThrow('Expected `valida options` to be of type `object` but received type `undefined`.');
    });
  });

  describe('returning an empty object', () => {
    it('should throw', () => {
      expect(() => {
        // @ts-expect-error
        createValidator(() => {
          return {};
        });
      }).toThrow('Expected property `spec` to be of type `object` but received type `undefined`.');
    });
  });

  describe('returning an invalid object', () => {
    it('should throw', () => {
      expect(() => {
        // @ts-expect-error
        createValidator(() => {
          return {
            a: 1
          };
        });
      }).toThrow('Expected property `spec` to be of type `object` but received type `undefined`.');

      expect(() => {
        // @ts-expect-error
        createValidator(() => {
          return {
            spec: false
          };
        });
      }).toThrow('Expected property `spec` to be of type `object` but received type `boolean`.');

      expect(() => {
        createValidator(() => {
          return {
            spec: {}
          };
        });
      }).toThrow('Expected property object `spec` to not be empty');

      expect(() => {
        createValidator(({ ow }) => {
          return {
            spec: {
              a: ow.number
            }
          };
        });
      }).not.toThrow();
    });
  });
});

describe('createValidator', () => {
  describe('validating objects', () => {
    it('should throw when bad data is received', () => {
      const validate = createValidator(({ ow }) => ({
        spec: {
          name: ow.string,
          age: ow.optional.number,
          favoriteThings: ow.optional.object.exactShape({
            color: ow.optional.any(ow.string, ow.boolean),
            ossDeveloper: ow.optional.string.oneOf([
              'Sebastian McKenzie',
              'Sindre is a Horse',
              'Nathan Rajlich'
            ])
          })
        },
        defaults: {
          age: 1
        }
      }));

      expect(() => {
        validate({
          name: false
        });
      }).toThrow('Expected property `name` to be of type `string` but received type `boolean` in object `options`.');

      expect(() => {
        return validate({
          name: 'Bob'
        });
      }).not.toThrow();

      expect(validate({
        name: 'Bob'
      })).toMatchObject({
        name: 'Bob',
        age: 1
      });

      expect(() => {
        validate({
          name: 'Bob',
          favoriteThings: {
            color: {}
          }
        });
      }).toThrow('Any predicate failed');

      expect(() => {
        validate({
          name: 'Bob',
          favoriteThings: {
            osDeveloper: 'Steve Ballmer'
          }
        });
      }).toThrow('Extraneous property `osDeveloper` in object `favoriteThings` may be a mistake. Did you mean `ossDeveloper`?');
    });
  });

  describe('partialShape errors', () => {
    it('should suggest keys when applicable', () => {
      const validate = createValidator(({ ow }) => ({
        spec: ow.object.partialShape({
          foo: ow.optional.string,
          bar: ow.number,
          baz: ow.boolean
        })
      }));

      // Incorrect key with a Levenshtein distance <= 2.
      expect(() => {
        validate({
          foo: '',
          bar: 1,
          bazz: false,
          extraKey: 'hello'
        });
      }).toThrow('Extraneous property `bazz` in object `options` may be a mistake. Did you mean `baz`?');

      // Incorrect key with a Levenshtein distance > 2.
      expect(() => {
        validate({
          foo: '',
          bar: 1,
          bazzzzzzzz: false,
          extraKey: 'hello'
        });
      }).toThrow('Expected property `baz` to be of type `boolean` but received type `undefined` in object `options`.');
    });
  });

  describe('exactShape errors', () => {
    it('should suggest keys when applicable', () => {
      const validate = createValidator(({ ow }) => ({
        spec: ow.object.exactShape({
          foo: ow.string,
          bar: ow.number,
          baz: ow.boolean
        })
      }));

      // Incorrectly-spelled key with a Levenshtein distance <= 2.
      expect(() => {
        validate({
          foo: '',
          bar: 1,
          bazz: false
        });
      }).toThrow('Extraneous property `bazz` in object `options` may be a mistake. Did you mean `baz`?');

      // Extraneous (disallowed) key.
      expect(() => {
        validate({
          foo: '',
          bar: 1,
          baz: false,
          extraKey: 'hello'
        });
      }).toThrow('Did not expect property `extraKey` to exist, got `hello` in object `options`.');
    });
  });

  describe('hasAnyKeys errors', () => {
    it('should suggest keys when applicable', () => {
      const validate = createValidator(({ ow }) => ({
        spec: ow.object.hasAnyKeys('foo', 'bar', 'baz')
      }));

      // Incorrectly-spelled key with a Levenshtein distance <= 2.
      expect(() => {
        validate({
          fooo: ''
        });
      }).toThrow('Property `fooo` in object `options` may be a mistake. Did you mean `foo`?');

      // Extraneous (disallowed) key.
      expect(() => {
        validate({});
      }).toThrow('Expected object `options` to have any key of `["foo","bar","baz"]`');
    });
  });

  describe('hasKeys errors', () => {
    it('should suggest keys when applicable', () => {
      const validate = createValidator(({ ow }) => ({
        spec: ow.object.hasKeys('foo', 'bar', 'baz')
      }));

      // Incorrectly-spelled key with a Levenshtein distance <= 2.
      expect(() => {
        validate({
          foo: true,
          bar: true,
          bazz: true
        });
      }).toThrow('Property `bazz` in object `options` may be a mistake. Did you mean `baz`?');

      // Extraneous (disallowed) key.
      expect(() => {
        validate({
          foo: true,
          bar: true,
          baz: true
        });
      }).not.toThrow();
    });
  });
});
