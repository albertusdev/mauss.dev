import { splitAt } from '../helper';

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
const markIt = require('markdown-it')({ html: true }).use(require('markdown-it-katex'));

const countReadTime = (content: string) => {
  const words = content.split(' ').filter((word) => word !== '');
  const images = content.match(/(!\[.+\]\(.+\))/g);
  const total = words.length + (images ? images.length * 12 : 0);
  const time = Math.round(total / 270);
  return time ? time : 1;
};

function parseFile(filename: string, content: string, parseCallback: Function) {
  const fmExpression = /---\r?\n([\s\S]+?)\r?\n---/;
  const [rawData, metadata] = fmExpression.exec(content);
  const frontMatter = metadata.split(/\r?\n/).reduce((acc, cur) => {
    const [key, val] = splitAt(cur.indexOf(':'), cur);
    if (key === 'tags') {
      acc[key] = val.split(',').map((v: string) => v.trim());
    } else acc[key] = val.trim();
    return acc;
  }, {});

  const cleanedFilename = filename.split('/').slice(-1)[0];
  const result = parseCallback(cleanedFilename, frontMatter);

  const article = content.slice(rawData.length + 1);
  result['read-time'] = countReadTime(article);
  result['content'] = markIt.render(article);
  return result;
}

function parseDir(dirname: string, fileParse: Function) {
  const DIR = join(process.cwd(), dirname);
  const FILTERED = readdirSync(DIR).filter((name) => name.endsWith('.md'));

  return FILTERED.map((filename) => {
    const mdFile = readFileSync(join(DIR, filename), 'utf8');
    return parseFile(filename, mdFile, fileParse);
  }).sort((x, y) => y.date.getTime() - x.date.getTime());
}

export { parseFile, parseDir };