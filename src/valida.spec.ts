import createValidator from './valida';

describe('createValidator', () => {
  describe('validating object shapes', () => {
    it('should work', () => {
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
            ossDeveloper: 'Nathan Rajlich'
          }
        });
      }).toThrow('asdf');
    });
  });

  describe('partialShape', () => {
    it('should work', () => {
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
    it('should work', () => {
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
});
