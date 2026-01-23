/**
 * Utility functions for Terraform code generation
 */

/**
 * Indent each line of a multi-line string
 */
export function indent(text: string, spaces: number = 2): string {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() ? prefix + line : line))
    .join('\n');
}

/**
 * Convert a string to a valid Terraform identifier
 */
export function toTerraformId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/-/g, '_');
}

/**
 * Format tags as Terraform map syntax
 */
export function formatTags(
  tags: Record<string, string>,
  projectName: string
): string {
  const allTags = {
    ...tags,
    Project: projectName,
  };

  const entries = Object.entries(allTags)
    .map(([key, value]) => `    ${key} = "${value}"`)
    .join('\n');

  return `{\n${entries}\n  }`;
}

/**
 * Generate a Terraform list from an array of strings
 */
export function toTerraformList(items: string[]): string {
  if (items.length === 0) return '[]';
  return `[${items.map((item) => `"${item}"`).join(', ')}]`;
}

/**
 * Escape special characters in strings for Terraform
 */
export function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Generate a comment block header
 */
export function commentBlock(title: string, description?: string): string {
  const lines = [
    '# =============================================================================',
    `# ${title}`,
    '# =============================================================================',
  ];

  if (description) {
    lines.push(`# ${description}`);
  }

  return lines.join('\n');
}

/**
 * Join multiple Terraform file sections with blank lines
 */
export function joinSections(...sections: (string | null | undefined)[]): string {
  return sections.filter(Boolean).join('\n\n');
}
