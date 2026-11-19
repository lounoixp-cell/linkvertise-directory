/**
 * Lightweight DOM Inspector Helper
 *
 * Inspects SSR/Next.js rendered HTML strings without heavy external DOM dependencies.
 * Provides tag, attribute, class, text assertions and strict minimalist bloat verification.
 */

import { assert, assertEquals, assertMatches } from './index';

export interface ParsedElement {
  tag: string;
  attributes: Record<string, string>;
  raw: string;
  textContent: string;
  hasAttribute(name: string, expectedValue?: string | RegExp): boolean;
  getAttribute(name: string): string | null;
  hasClass(className: string): boolean;
}

export class DOMElement implements ParsedElement {
  public tag: string;
  public attributes: Record<string, string>;
  public raw: string;
  public textContent: string;

  constructor(tag: string, attributes: Record<string, string>, raw: string, textContent: string = '') {
    this.tag = tag.toLowerCase();
    this.attributes = attributes;
    this.raw = raw;
    this.textContent = textContent;
  }

  hasAttribute(name: string, expectedValue?: string | RegExp | boolean): boolean {
    const key = name.toLowerCase();
    const exists = Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (!exists) {
      return expectedValue === false;
    }
    if (expectedValue === undefined || expectedValue === true) {
      return true;
    }
    const val = this.attributes[key];
    if (typeof expectedValue === 'string') {
      return val === expectedValue;
    }
    if (expectedValue instanceof RegExp) {
      return expectedValue.test(val);
    }
    return false;
  }

  getAttribute(name: string): string | null {
    const key = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null;
  }

  hasClass(className: string): boolean {
    const classAttr = this.getAttribute('class');
    if (!classAttr) return false;
    const classes = classAttr.split(/\s+/);
    return classes.includes(className);
  }
}

/**
 * Parse HTML string into list of tags with attributes and inner text
 */
function parseTags(html: string): DOMElement[] {
  const elements: DOMElement[] = [];

  // Match all opening / self-closing HTML tags: <tag attr="val" ... >
  const tagRegex = /<([a-zA-Z0-9-]+)((?:\s+[^=>\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
  let match: RegExpExecArray | null;

  const VOID_TAGS = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1];
    if (tagName.startsWith('!') || tagName.startsWith('/')) continue;

    const rawAttrs = match[2];
    const isSelfClosing = match[3] === '/' || VOID_TAGS.has(tagName.toLowerCase());

    // Extract text content until </tagName> if not void/self-closing
    let textContent = '';
    if (!isSelfClosing) {
      const rest = html.slice(match.index + match[0].length);
      const closeTagIdx = rest.toLowerCase().indexOf(`</${tagName.toLowerCase()}>`);
      if (closeTagIdx !== -1) {
        textContent = rest.slice(0, closeTagIdx).replace(/<[^>]+>/g, '').trim();
      } else {
        const nextTagIdx = rest.indexOf('<');
        if (nextTagIdx !== -1) {
          textContent = rest.slice(0, nextTagIdx).trim();
        }
      }
    }

    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9-:_]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] !== undefined
        ? attrMatch[2]
        : attrMatch[3] !== undefined
        ? attrMatch[3]
        : attrMatch[4] !== undefined
        ? attrMatch[4]
        : '';
      attributes[attrName] = attrVal;
    }

    elements.push(new DOMElement(tagName, attributes, match[0], textContent));
  }

  return elements;
}

export class DOMInspector {
  public html: string;
  private elements: DOMElement[];

  constructor(html: string) {
    this.html = html;
    this.elements = parseTags(html);
  }

  /**
   * Find first element matching tag and optional attribute filters
   */
  findTag(tag: string, filterAttrs?: Record<string, string | RegExp | boolean>): DOMElement | null {
    const lowerTag = tag.toLowerCase();
    return (
      this.elements.find((el) => {
        if (el.tag !== lowerTag) return false;
        if (!filterAttrs) return true;
        for (const [attrName, expected] of Object.entries(filterAttrs)) {
          if (!el.hasAttribute(attrName, expected)) return false;
        }
        return true;
      }) || null
    );
  }

  /**
   * Find all elements matching tag and optional attribute filters
   */
  findAllTags(tag: string, filterAttrs?: Record<string, string | RegExp | boolean>): DOMElement[] {
    const lowerTag = tag.toLowerCase();
    return this.elements.filter((el) => {
      if (el.tag !== lowerTag) return false;
      if (!filterAttrs) return true;
      for (const [attrName, expected] of Object.entries(filterAttrs)) {
        if (!el.hasAttribute(attrName, expected)) return false;
      }
      return true;
    });
  }

  /**
   * Assert tag exists in rendered HTML
   */
  assertHasTag(tag: string, filterAttrs?: Record<string, string | RegExp | boolean>, message?: string): DOMElement {
    const found = this.findTag(tag, filterAttrs);
    const filterDesc = filterAttrs ? ` with attributes ${JSON.stringify(filterAttrs)}` : '';
    assert(found !== null, message || `Expected tag <${tag}>${filterDesc} in rendered HTML, but not found.`);
    return found;
  }

  /**
   * Assert attribute value on first matching tag
   */
  assertAttribute(tag: string, attribute: string, expectedVal: string | RegExp, message?: string): void {
    const el = this.assertHasTag(tag, undefined, message);
    const actual = el.getAttribute(attribute);
    assert(actual !== null, `Expected attribute "${attribute}" on <${tag}>, but attribute was absent.`);
    if (typeof expectedVal === 'string') {
      assertEquals(actual, expectedVal, message || `Attribute "${attribute}" on <${tag}> does not match expected.`);
    } else {
      assertMatches(actual, expectedVal, message || `Attribute "${attribute}" on <${tag}> does not match pattern.`);
    }
  }

  /**
   * Assert text content exists anywhere in the HTML
   */
  assertTextContent(pattern: string | RegExp, message?: string): void {
    if (typeof pattern === 'string') {
      assert(this.html.includes(pattern), message || `Expected text content "${pattern}" to appear in HTML.`);
    } else {
      assert(pattern.test(this.html), message || `Expected pattern ${pattern} to match text in HTML.`);
    }
  }

  /**
   * Assert text content DOES NOT exist anywhere in HTML
   */
  assertNoTextContent(pattern: string | RegExp, message?: string): void {
    if (typeof pattern === 'string') {
      assert(!this.html.includes(pattern), message || `Expected text content "${pattern}" to NOT appear in HTML, but it was found.`);
    } else {
      assert(!pattern.test(this.html), message || `Expected pattern ${pattern} to NOT match HTML, but it matched.`);
    }
  }

  /**
   * Extract all anchor links: href, text, target, rel
   */
  extractLinks(): Array<{ href: string; text: string; target: string | null; rel: string | null; raw: string }> {
    return this.findAllTags('a').map((el) => ({
      href: el.getAttribute('href') || '',
      text: el.textContent,
      target: el.getAttribute('target'),
      rel: el.getAttribute('rel'),
      raw: el.raw,
    }));
  }

  /**
   * Extract all image elements: src, alt, class
   */
  extractImages(): Array<{ src: string; alt: string | null; className: string | null; raw: string }> {
    return this.findAllTags('img').map((el) => ({
      src: el.getAttribute('src') || '',
      alt: el.getAttribute('alt'),
      className: el.getAttribute('class'),
      raw: el.raw,
    }));
  }

  /**
   * Assert absence of forbidden bloat (ORIGINAL_REQUEST §1, §32)
   * The specification explicitly mandates:
   * - Absolutely NO hero sections, marketing copy, descriptions, feature explanations, or decorative elements.
   * - Minimalist design, content-first.
   */
  assertNoBloat(): void {
    // Forbidden marketing copy phrases
    const forbiddenPhrases = [
      /revolutioniz(e|ing)/i,
      /the ultimate destination/i,
      /best links on the internet/i,
      /subscribe to our newsletter/i,
      /join \d+[,.]?\d*\+? members/i,
      /marketing banner/i,
      /sponsor(ed)? post/i,
      /sign up for pro/i,
    ];

    for (const phrase of forbiddenPhrases) {
      assert(!phrase.test(this.html), `Bloat detected: HTML contains marketing copy matching ${phrase}`);
    }

    // Forbidden class names or ID elements
    const forbiddenPatterns = [
      /class="[^"]*(hero-section|marketing-banner|promo-box|ad-container)[^"]*"/i,
      /id="[^"]*(hero|ad-banner|promo-popup)[^"]*"/i,
    ];

    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(this.html), `Bloat detected: HTML contains element matching ${pattern}`);
    }
  }

  /**
   * Assert presence of responsive grid configuration classes
   */
  assertResponsiveGrid(): void {
    const hasGrid = /grid\s/i.test(this.html) || /class="[^"]*grid[^"]*"/i.test(this.html);
    assert(hasGrid, 'Expected CSS Grid layout in rendered HTML');
  }
}

export function createDOMInspector(html: string): DOMInspector {
  return new DOMInspector(html);
}
