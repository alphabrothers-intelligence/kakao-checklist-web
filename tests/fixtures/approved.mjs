// Parse the supplied document independently of app data; preserve table order and copy.
import { readFileSync } from 'node:fs';
const text = readFileSync(new URL('./approved-2026-09-15.md', import.meta.url), 'utf8');
const tables = [...text.matchAll(/(?:^\|.*\n?)+/gm)].map(m => m[0].trim().split('\n').map(row => row.split('|').slice(1,-1).map(s => s.trim())));
const product = cell => cell.split(' — ');
export const industries = tables[0].slice(2).map(row => row[0].split(' *')[0]);
export const top = tables[0].slice(2).map(row => row.slice(1).map(product));
export const paths = tables[6].slice(2).map(row => row[0]);
export const situations = tables[1][0].slice(1);
export const goals = tables[6][0].slice(1);
export const cases = [];
for (let i=0;i<6;i++) for (let p=0;p<5;p++) for (let s=0;s<5;s++) for (let g=0;g<4;g++) {
 cases.push({answers:[i,p,s,g],top:top[i],products:tables[6][p+2][g+1].split(' / ').map(product),advice:[tables[p+1].slice(2).map(row=>row[s+1])],chips:[industries[i],paths[p],situations[s],goals[g]]});
}
export const questions = text.split(/step\d - /).slice(1).map(block => {
 const lines=block.split('\n');
 const choices=lines.filter(line=>line.startsWith('- '));
 return {title:lines.slice(1).find(line=>line.trim()).trim().replace(/^Q\. /,''),options:choices.map(line=>line.startsWith('- [')?line.slice(3,line.indexOf(']')):line.slice(2,line.indexOf(' ('))),desc:Object.fromEntries(choices.map((line,i)=>[i,line.startsWith('- [')?line.slice(line.indexOf(']')+1).trim():line.slice(line.indexOf(' (')+2).replace(/\)+$/,'').replace(/\s*,\s*/g,', ')]))};
});
