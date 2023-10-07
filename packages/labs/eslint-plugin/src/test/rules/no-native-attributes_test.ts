import * as mocha from 'mocha';
import {rules} from '../../index.js';
import {TSESLint} from '@typescript-eslint/utils';
import {RuleTester} from '@typescript-eslint/rule-tester';
import {fileURLToPath} from 'node:url';

const packagePath = fileURLToPath(
  new URL(`../../../test-files/ts/simple`, import.meta.url).href
);
const rule = rules['no-native-attributes'];

RuleTester.afterAll = mocha.after;

const ruleTester = new RuleTester({
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    tsconfigRootDir: packagePath,
    project: './tsconfig.json',
  },
  parser: fileURLToPath(import.meta.resolve('@typescript-eslint/parser')),
});

ruleTester.run('no-native-attributes', rule as TSESLint.AnyRuleModule, {
  valid: [
    `import {LitElement} from 'lit';
    /** @customElement x-foo */
    export class Foo extends LitElement {
      static properties = {
        foo: { type: String }
      }
    }`,
  ],

  invalid: [
    {
      code: `import {LitElement} from 'lit';
      /** @customElement x-foo */
      class Foo extends LitElement {
        static properties = {
          title: { type: String }
        }
      }`,
      errors: [
        {
          messageId: 'noNativeAttributes',
          data: {prop: 'title'},
        },
      ],
    },
    {
      code: `import {LitElement} from 'lit';
      /** @customElement x-foo */
      class Foo extends LitElement {
        static get properties() {
          return {
            title: { type: String }
          }
        }
      }`,
      errors: [
        {
          messageId: 'noNativeAttributes',
          data: {prop: 'title'},
        },
      ],
    },
  ],
});
