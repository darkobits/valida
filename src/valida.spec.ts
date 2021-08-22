/* eslint-disable import/first, import/order */
import { expectTypeOf } from 'expect-type';
import type { BasePredicate } from 'ow';
import type { DeepPartial } from 'ts-essentials';

import { ShapeFor, DefaultsFor, PredicateFor } from 'etc/types';

import createValidator from './valida';


describe('types', () => {
  describe('PredicateFor / ShapeFor / DefaultsFor', () => {
    it('should perform complementary', () => {
      interface MyObjType {
        name: string;
        foo: {
          bar: number;
        };
      }

      type Predicate = PredicateFor<MyObjType>;
      expectTypeOf<Predicate>().toMatchTypeOf<BasePredicate>();

      type Shape = ShapeFor<Predicate>;
      expectTypeOf<Shape>().toMatchTypeOf<MyObjType>();

      type Defaults = DefaultsFor<Predicate>;
      expectTypeOf<Defaults>().toMatchTypeOf<DeepPartial<MyObjType>>();
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

  describe('partialShape', () => {
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

  describe('exactShape', () => {
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

  describe('hasAnyKeys', () => {
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

  describe('hasKeys', () => {
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
