import {rule as noNativeAttributes} from './rules/no-native-attributes.js';
import {TSESLint} from '@typescript-eslint/utils';
import {Rule} from 'eslint';

export const configs = {};

export const rules: Record<string, Rule.RuleModule | TSESLint.AnyRuleModule> = {
  'no-native-attributes': noNativeAttributes,
};
