import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(scriptDirectory, '..');
const sourceRoot = resolve(adminRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const violations = [];

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path);
      return sourceExtensions.has(extname(entry.name)) ? [path] : [];
    })
  );
  return files.flat();
};

const getTagName = (node, sourceFile) => node.tagName.getText(sourceFile);

const getAttribute = (node, name) =>
  node.attributes.properties.find(
    (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === name
  );

const hasAttribute = (node, name) => Boolean(getAttribute(node, name));

const getStaticAttributeValue = (node, name) => {
  const attribute = getAttribute(node, name);
  if (!attribute?.initializer) return attribute ? '' : null;
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (
    ts.isJsxExpression(attribute.initializer) &&
    attribute.initializer.expression &&
    (ts.isStringLiteral(attribute.initializer.expression) ||
      ts.isNoSubstitutionTemplateLiteral(attribute.initializer.expression))
  ) {
    return attribute.initializer.expression.text;
  }
  return null;
};

const hasAccessibleName = (node) =>
  hasAttribute(node, 'id') ||
  hasAttribute(node, 'aria-label') ||
  hasAttribute(node, 'aria-labelledby');

const hasAncestorTag = (node, tagName, sourceFile) => {
  let parent = node.parent;
  while (parent) {
    if (
      (ts.isJsxElement(parent) && getTagName(parent.openingElement, sourceFile) === tagName) ||
      (ts.isJsxSelfClosingElement(parent) && getTagName(parent, sourceFile) === tagName)
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
};

const containsTag = (node, tagName, sourceFile) => {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (
      (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) &&
      getTagName(child, sourceFile) === tagName
    ) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return found;
};

const report = (sourceFile, node, message) => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  violations.push(
    `${relative(adminRoot, sourceFile.fileName)}:${line + 1}:${character + 1} ${message}`
  );
};

const forbiddenTailwindColor =
  /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g;
const hardcodedColor = /#[\da-fA-F]{3,8}\b|\brgba?\s*\(/g;
const suppression = /@ts-(?:ignore|expect-error)|eslint-disable/g;

for (const filePath of await collectSourceFiles(sourceRoot)) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  for (const [pattern, message] of [
    [forbiddenTailwindColor, 'uses a palette utility instead of a design token'],
    [hardcodedColor, 'uses a hard-coded color instead of a design token'],
    [suppression, 'uses a TypeScript or ESLint suppression'],
  ]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(match.index);
      violations.push(
        `${relative(adminRoot, filePath)}:${line + 1}:${character + 1} ${message}: ${match[0]}`
      );
    }
  }

  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      report(sourceFile, node, 'uses explicit any');
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (
        ts.isPropertyAccessExpression(expression) &&
        expression.expression.getText(sourceFile) === 'console' &&
        ['log', 'error', 'warn', 'debug'].includes(expression.name.text)
      ) {
        report(sourceFile, node, `calls console.${expression.name.text}`);
      }

      const callName = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression) &&
            ['window', 'globalThis'].includes(expression.expression.getText(sourceFile))
          ? expression.name.text
          : null;
      if (callName && ['alert', 'confirm', 'prompt'].includes(callName)) {
        report(sourceFile, node, `uses the native ${callName} dialog`);
      }
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = getTagName(node, sourceFile);
      const relativePath = relative(adminRoot, filePath);

      if (tagName === 'button' && !hasAttribute(node, 'type')) {
        report(sourceFile, node, 'native button is missing an explicit type');
      }

      if (tagName === 'a' && getStaticAttributeValue(node, 'target') === '_blank') {
        const rel = getStaticAttributeValue(node, 'rel') ?? '';
        if (!rel.split(/\s+/).includes('noopener') || !rel.split(/\s+/).includes('noreferrer')) {
          report(sourceFile, node, 'new-tab link must use rel="noopener noreferrer"');
        }
      }

      if (
        hasAttribute(node, 'dangerouslySetInnerHTML') &&
        relative(adminRoot, filePath) !== 'src/app/layout.tsx'
      ) {
        report(
          sourceFile,
          node,
          'dangerouslySetInnerHTML is only allowed for the root theme script'
        );
      }

      if (tagName === 'Label' && !hasAttribute(node, 'htmlFor')) {
        report(sourceFile, node, 'Label is not associated with a control');
      }
      if (tagName === 'label' && !hasAttribute(node, 'htmlFor')) {
        report(sourceFile, node, 'native label is not associated with a control');
      }

      if (
        ['Input', 'Textarea', 'SelectTrigger'].includes(tagName) &&
        !hasAccessibleName(node) &&
        !hasAncestorTag(node, 'Label', sourceFile) &&
        !hasAncestorTag(node, 'label', sourceFile)
      ) {
        report(sourceFile, node, `${tagName} is missing an accessible name`);
      }

      if (
        ['input', 'textarea', 'select'].includes(tagName) &&
        !relativePath.startsWith('src/components/ui/') &&
        getStaticAttributeValue(node, 'type') !== 'hidden' &&
        !hasAccessibleName(node) &&
        !hasAncestorTag(node, 'Label', sourceFile) &&
        !hasAncestorTag(node, 'label', sourceFile)
      ) {
        report(sourceFile, node, `${tagName} is missing an accessible name`);
      }

      if (
        tagName === 'Textarea' &&
        relativePath !== 'src/components/ui/textarea.tsx' &&
        !hasAttribute(node, 'maxLength')
      ) {
        report(sourceFile, node, 'Textarea is missing maxLength');
      }

      if (['img', 'Image'].includes(tagName) && !hasAttribute(node, 'alt')) {
        report(sourceFile, node, `${tagName} is missing alt text`);
      }
    }

    if (ts.isJsxElement(node)) {
      const tagName = getTagName(node.openingElement, sourceFile);
      if (tagName === 'DialogContent') {
        if (!containsTag(node, 'DialogTitle', sourceFile)) {
          report(sourceFile, node, 'DialogContent is missing DialogTitle');
        }
        if (!containsTag(node, 'DialogDescription', sourceFile)) {
          report(sourceFile, node, 'DialogContent is missing DialogDescription');
        }
      }
      if (tagName === 'SheetContent') {
        if (!containsTag(node, 'SheetTitle', sourceFile)) {
          report(sourceFile, node, 'SheetContent is missing SheetTitle');
        }
        if (!containsTag(node, 'SheetDescription', sourceFile)) {
          report(sourceFile, node, 'SheetContent is missing SheetDescription');
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

if (violations.length) {
  throw new Error(`Admin UI contract violations:\n${violations.join('\n')}`);
}

console.log('Admin UI contract verified.');
