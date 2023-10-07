// eslint-disable-next-line import/no-extraneous-dependencies
import ts from 'typescript';
import * as path from 'node:path';
import {Analyzer, type AbsolutePath} from '@lit-labs/analyzer';
import {
  type ReactiveProperty,
  type LitElementDeclaration,
} from '@lit-labs/analyzer';
// eslint-disable-next-line import/extensions
import {getParserServices} from '@typescript-eslint/utils/eslint-utils';
// eslint-disable-next-line import/extensions
import * as TSESLint from '@typescript-eslint/utils/ts-eslint';
import {TSESTree} from '@typescript-eslint/types';

type MessageIds = 'noNativeAttributes';

const analyzers = new WeakMap<TSESLint.RuleContext<MessageIds, []>, Analyzer>();

const getOrCreateAnalyzer = (
  context: TSESLint.RuleContext<MessageIds, []>
): Analyzer => {
  const cached = analyzers.get(context);
  if (cached) {
    return cached;
  }
  const services = getParserServices(context);
  const program = services.program;
  const analyzer = new Analyzer({
    getProgram: () => program,
    typescript: ts,
    fs: ts.sys,
    path,
  });
  analyzers.set(context, analyzer);
  return analyzer;
};

const getCustomElement = (
  context: TSESLint.RuleContext<MessageIds, []>,
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression
): LitElementDeclaration | null => {
  if (!context.getPhysicalFilename) {
    return null;
  }

  const services = getParserServices(context);
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);

  if (!tsNode) {
    return null;
  }

  const analyzer = getOrCreateAnalyzer(context);
  const mod = analyzer.getModule(context.getPhysicalFilename() as AbsolutePath);
  const elements = mod.getCustomElementExports();

  const element = elements.find((decl) => decl.node === tsNode);

  return element ?? null;
};

const getPropertyMap = (
  context: TSESLint.RuleContext<MessageIds, []>,
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression
): Map<string, ReactiveProperty> => {
  const decl = getCustomElement(context, node);

  if (!decl) {
    return new Map<string, ReactiveProperty>();
  }

  return decl.reactiveProperties;
};

const NATIVE_ATTRS = [
  'accesskey',
  'autocapitalize',
  'autofocus',
  'class',
  'contenteditable',
  'contextmenu',
  'dir',
  'draggable',
  'enterkeyhint',
  'exportparts',
  'hidden',
  'id',
  'inert',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'lang',
  'nonce',
  'part',
  'popover',
  'role',
  'slot',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate',
  'virtualkeyboardpolicy',
];

export const rule: TSESLint.RuleModule<MessageIds, []> = {
  defaultOptions: [],
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallows use of native attributes as properties',
      url: 'https://github.com/43081j/eslint-plugin-lit/blob/master/docs/rules/no-native-attributes.md',
    },
    schema: [],
    messages: {
      noNativeAttributes:
        'The {{ prop }} attribute is a native global attribute. ' +
        'Using it as a property could have unintended side-effects.',
    },
  },

  create(context): TSESLint.RuleListener {
    return {
      'ClassExpression,ClassDeclaration': (
        node: TSESTree.ClassDeclaration | TSESTree.ClassExpression
      ): void => {
        const propertyMap = getPropertyMap(context, node);

        for (const prop of propertyMap.keys()) {
          if (NATIVE_ATTRS.includes(prop)) {
            context.report({
              node,
              messageId: 'noNativeAttributes',
              data: {prop},
            });
          }
        }
      },
    };
  },
};
