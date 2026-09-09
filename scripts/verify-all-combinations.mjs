import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { cases } from '../tests/fixtures/approved.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const baseURL=process.argv[2]||'http://127.0.0.1:5174';
const passed=[], errors=[];
try {
 await Promise.all(Array.from({length:4},async(_,worker)=>{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  for(let n=worker;n<cases.length;n+=4){
   const c=cases[n];
   await page.getByRole('button',{name:'광고 진단 시작하기',exact:true}).click();
   for(let step=0;step<4;step++){
    await expect(page.getByRole('radio')).toHaveCount([7,5,5,4][step]);
    await expect(page.getByRole('button',{name:step===3?'결과 보기':'다음',exact:true})).toBeDisabled();
    await page.getByRole('radio').nth(c.answers[step]).check();
    await expect(page.getByRole('radio',{checked:true})).toHaveCount(1);
    await page.getByRole('button',{name:step===3?'결과 보기':'다음',exact:true}).click();
   }
   await page.locator('.result').waitFor();
   const actual=await page.evaluate(()=>({
    top:[...document.querySelectorAll('.rank')].map(n=>[n.querySelector('h3').textContent,n.querySelector('p').textContent]),
    products:[...document.querySelectorAll('.recommend')].map(n=>[...n.childNodes].filter(c=>c.nodeType===Node.TEXT_NODE).map(c=>c.textContent).join('')),
    advice:[...document.querySelectorAll('.advice')].map(n=>[n.querySelector('.problem-name').textContent,...[...n.querySelectorAll('.advice-row p')].map(p=>p.textContent)]),
    contexts:[...document.querySelectorAll('.advice')].map(n=>n.querySelector('.advice-context span')?.textContent??null),
    chips:[...document.querySelectorAll('.chip')].map(n=>n.textContent)
   }));
   const {answers,...expected}=c;
   assert.deepEqual(actual,expected,`Answers ${answers}`);
   assert.equal(await page.locator('.review-note').count(),c.advice.length===2?1:0);
   passed.push(answers);
   if(passed.length%100===0) console.log(`${passed.length}/700 browser cases passed`);
   await page.getByRole('button',{name:'다시 진단하기',exact:true}).click();
  }
  await page.close();
 }));
 assert.deepEqual(errors,[]);
 assert.equal(passed.length,700);
 await mkdir('artifacts/qa',{recursive:true});
 await writeFile('artifacts/qa/all-combinations.json',JSON.stringify({baseURL,passed:passed.length,dualBranchCases:168,errors,answers:passed},null,2));
 console.log('PASS: all 700 real UI selection flows and exact result content; 168 use the documented dual-branch fallback.');
} finally {await browser.close();}
