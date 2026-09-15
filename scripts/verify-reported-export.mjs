import { chromium, webkit, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = process.argv[2] || 'https://kakao-checklist-web.vercel.app';
const dir = 'artifacts/reported-export';
await mkdir(dir, {recursive:true});
const results=[];
for (const [name, engine] of [['webkit',webkit],['chromium',chromium]]) {
 const browser=await engine.launch(name==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 try {
  const page=await browser.newPage({...devices['iPhone 13 Pro'],viewport:{width:402,height:874},deviceScaleFactor:3});
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.goto(`${base}/?qa=reported-export-67c47ae`);
  await page.getByRole('button',{name:'광고 자가 진단 시작하기'}).click();
  for (const [step,option] of ['패션/뷰티','온라인 전환형','관심 부족','관심·인지도 높이기'].entries()) {
   await page.getByRole('radio',{name:option}).check();
   await page.getByRole('button',{name:step===3?'결과 보기':'다음',exact:true}).click();
  }
  await page.locator('.result').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await page.locator('.answer-summary dd').allTextContents(),['패션/뷰티','온라인 전환형','관심 부족','관심·인지도 높이기']);
  await page.screenshot({path:`${dir}/${name}-screen.png`,animations:'disabled',fullPage:true});
  await page.getByRole('button',{name:'결과 다운로드하기'}).click();
  for (const [format,label] of [['png','이미지로 저장'],['pdf','PDF로 저장']]) {
   const download=page.waitForEvent('download',{timeout:90000});
   await page.getByRole('button',{name:label,exact:true}).click();
   await (await download).saveAs(`${dir}/${name}.${format}`);
  }
  const png=await readFile(`${dir}/${name}.png`);
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(width,1170); assert.ok(height>6000 && height<16000);
  const assets=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>url.includes('renderResultCanvas')));
  assert.ok(assets.length>0,'Production must load the direct canvas renderer');
  assert.equal(await page.locator('dialog a').count(),0);
  assert.deepEqual(errors,[]);
  results.push({engine:name,viewport:{width:402,height:874},answers:[1,2,1,1],png:{width,height},renderer:assets,errors});
 } finally {await browser.close();}
}
await writeFile(`${dir}/report.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
