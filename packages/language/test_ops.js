import { Template } from './src/index.ts';

const template = `
{{ 5 + 3 }}
{{ 17 // 5 }}
{{ "Hello" ~ " World" }}
{% if x is string_containing("test") %}found{% endif %}
{{ score > 50 ? "Pass" : "Fail" }}
`;

try {
  const t = new Template(template);
  console.log('✓ All operators parsed successfully!');
  console.log('Parsed AST has', t.parsed.body.length, 'statements');
} catch (e) {
  console.error('✗ Parser error:', e.message);
}
