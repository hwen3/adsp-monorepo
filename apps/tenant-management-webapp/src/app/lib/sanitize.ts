import { addHook } from 'dompurify';
import { sanitize as docPurified } from 'dompurify';
import { hasProperHtmlWrapper } from '@core-services/notification-shared';
import * as xss from 'xss';

const options = {
  whiteList: {
    html: [],
    div: ['style', 'class'],
    a: ['href', 'title', 'target', 'style', 'class'],
    footer: ['style'],
    header: ['style'],
    abbr: ['title', 'style'],
    address: ['style'],
    area: ['shape', 'coords', 'href', 'alt', 'style'],
    article: [],
    aside: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    hr: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    ins: ['datetime'],
    li: [],
    mark: [],
    nav: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    section: [],
    small: [],
    span: [],
    sub: [],
    summary: [],
    sup: [],
    strong: [],
    strike: [],
    table: ['width', 'border', 'align', 'valign', 'class', 'style'],
    tbody: ['align', 'valign', 'class', 'style'],
    body: ['class', 'style'],
    td: ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
    tfoot: ['align', 'valign', 'class', 'style'],
    th: ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
    thead: ['align', 'valign'],
    tr: ['rowspan', 'align', 'valign'],
    tt: [],
    u: [],
    ul: [],
  },
}; // Custom rules
const xssFilter = new xss.FilterXSS(options);

export { sanitize as sanitizeHtml } from 'dompurify';
addHook('afterSanitizeAttributes', function (node) {
  // set all elements owning target to target=_blank
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function hasXSS(html) {
  const sanitized = xssFilter.process(html);

  return sanitized !== html;
}

export const htmlSanitized = (html) => {
  return docPurified(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });
};
const removeBlankLine = (input: string) => input.trim().replace(/[^\x20-\x7E]/gim, '');
