import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const baseURL = process.argv[2] || process.env.APP_URL || 'http://127.0.0.1:5173';
const dir = 'artifacts/browser'; await mkdir(dir, {recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(baseURL + '/');
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:`${dir}/desktop-intro.png`,animations:'disabled',fullPage:true});
await page.getByRole('button',{name:'광고 자가 진단 시작하기'}).click();
assert.equal(await page.locator('.step-number').textContent(),'STEP 1');
assert.ok((await page.locator('#question-description').textContent()).includes('선택해주세요.'));
await page.getByRole('radio',{name:'식품 음식점, 카페, 식품 브랜드',exact:true}).check();
assert.equal(await page.getByRole('radio',{checked:true}).count(),1);
await page.screenshot({path:`${dir}/desktop-question.png`,animations:'disabled',fullPage:true});
await page.getByRole('button',{name:'다음',exact:true}).click();
await page.getByRole('radio',{name:'온라인 전환형'}).check();
await page.reload();
await page.getByRole('radio',{name:'온라인 전환형'}).waitFor();
assert.equal(await page.getByRole('radio',{name:'온라인 전환형'}).isChecked(),true);
await page.goBack();
await page.getByRole('heading',{name:'어떤 사업을 운영하고 계신가요?'}).waitFor();
await page.goForward();
await page.getByRole('button',{name:'다음',exact:true}).click();
await page.getByRole('radio',{name:'전환 부족'}).check();
await page.getByRole('button',{name:'다음',exact:true}).click();
await page.getByRole('radio',{name:'관심·인지도 높이기'}).check();
await page.getByRole('button',{name:'결과 보기',exact:true}).click();
await page.locator('.result').waitFor();await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.getByRole('button',{name:'답변 수정',exact:true}).count(),0);
assert.equal(await page.locator('.answer-summary dd').count(),4);
assert.equal(await page.locator('.chips').count(),0);
assert.deepEqual(await page.locator('.section-index').allTextContents(),['01','02','03','04']);
const character=await page.locator('.result-character').evaluate(async img=>{
 await img.decode();
 const animations=img.getAnimations();
 const name=getComputedStyle(img).animationName;
 await Promise.all(animations.map(a=>a.finished));
 return {loaded:img.naturalWidth>0,name,opacity:getComputedStyle(img).opacity,transform:getComputedStyle(img).transform};
});
assert.ok(character.loaded);
assert.equal(character.name,'character-slide-in');
assert.equal(character.opacity,'1');
assert.equal(character.transform,'matrix(1, 0, 0, 1, 0, 0)');

async function checkResultHierarchy(target){
 const layout=await target.evaluate(()=>({
  sections:[...document.querySelectorAll('.sectionno')].map(n=>({size:getComputedStyle(n).fontSize,numberSize:getComputedStyle(n.querySelector('.section-index')).fontSize,weight:getComputedStyle(n).fontWeight})),
  problems:[...document.querySelectorAll('.advice-heading')].map(n=>({label:n.querySelector('.advice-caption').textContent,size:parseFloat(getComputedStyle(n.querySelector('.advice-caption')).fontSize),weight:getComputedStyle(n.querySelector('.advice-caption')).fontWeight,bottom:n.querySelector('.advice-caption').getBoundingClientRect().bottom,titleTop:n.querySelector('h3').getBoundingClientRect().top}))
 }));
 assert.ok(layout.sections.length===4 && layout.sections.every(n=>n.size===n.numberSize && Number(n.weight)>=700));
 assert.ok(layout.problems.length>0 && layout.problems.every(n=>n.label==='현재 문제' && n.size>=17 && Number(n.weight)===400 && n.titleTop>=n.bottom));
}
await checkResultHierarchy(page);

await page.screenshot({path:`${dir}/desktop-result.png`,animations:'disabled',fullPage:true});
const buttons=await page.locator('.actions button').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,top:n.getBoundingClientRect().top})));
assert.ok(buttons.every(b=>Math.abs(b.width-buttons[0].width)<1&&b.top===buttons[0].top));
await page.getByRole('button',{name:'결과 다운로드하기'}).click();
assert.equal(await page.locator('dialog .primary').first().textContent(),'PDF로 저장');
for(const [format,name] of [['png','이미지로 저장'],['pdf','PDF로 저장']]){
 const pending=page.waitForEvent('download',{timeout:90000});
 await page.getByRole('button',{name,exact:true}).click();
 const download=await pending;await download.saveAs(`${dir}/result.${format}`);
 await page.getByRole('button',{name,exact:true}).waitFor({state:'visible'});
}
await page.getByRole('button',{name:'닫기',exact:true}).click();
await page.getByRole('button',{name:'광고 가이드 확인하기'}).click();
assert.equal(await page.getByRole('button',{name:/나에게 딱 맞는 광고 가이드/}).isDisabled(),true);
await page.keyboard.press('Escape');
await page.getByRole('button',{name:'다시 테스트하기'}).click();
await page.getByRole('button',{name:'광고 자가 진단 시작하기'}).waitFor();
await page.getByRole('button',{name:'광고 자가 진단 시작하기'}).click();
assert.equal(await page.getByRole('radio',{checked:true}).count(),0);
const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
mobile.on('pageerror',e=>errors.push(e.message));
await mobile.goto(baseURL);
await mobile.evaluate(()=>document.fonts.ready);
for(const width of [320,390,768]){
 await mobile.setViewportSize({width,height:844});
 const order=await mobile.evaluate(()=>{
  const copy=document.querySelector('.intro-copy').getBoundingClientRect();
  const art=document.querySelector('.main-character-stage').getBoundingClientRect();
  const button=document.querySelector('.brand-intro .dock').getBoundingClientRect();
  return {copyBottom:copy.bottom,artTop:art.top,artBottom:art.bottom,buttonTop:button.top,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 assert.ok(order.copyBottom<=order.artTop && order.artBottom<=order.buttonTop && !order.overflow);
}
await mobile.setViewportSize({width:390,height:844});
await mobile.screenshot({path:`${dir}/mobile-intro.png`,animations:'disabled',fullPage:true});
await mobile.goto(baseURL + '/#/result');
await mobile.getByRole('heading',{name:'어떤 사업을 운영하고 계신가요?'}).waitFor();
assert.equal(await mobile.getByRole('button',{name:'다음',exact:true}).isDisabled(),true);
await mobile.locator('.option').last().scrollIntoViewIfNeeded();
await mobile.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
const lastOption = await mobile.locator('.option').last().boundingBox();
const dock = await mobile.locator('.dock').boundingBox();
assert.ok(lastOption.y + lastOption.height <= dock.y + 1, 'Last choice must be above the fixed button after scrolling');
await mobile.screenshot({path:`${dir}/mobile-question-bottom.png`,animations:'disabled'});
await mobile.evaluate(()=>window.scrollTo(0,0));
await mobile.screenshot({path:`${dir}/mobile-question.png`,animations:'disabled',fullPage:true});
for(const [step,name] of [[0,'생활/여가'],[1,'상담 전환형'],[2,'측정 부족'],[3,'재방문·재구매 유도']]){
 await mobile.getByRole('radio',{name}).check();
 await mobile.getByRole('button',{name:step===3?'결과 보기':'다음',exact:true}).click();
}
await mobile.locator('.result').waitFor();
assert.equal(await mobile.locator('.advice').count(),1);
await checkResultHierarchy(mobile);
assert.equal(await mobile.getByRole('button',{name:'답변 수정',exact:true}).count(),0);
assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await mobile.screenshot({path:`${dir}/mobile-result.png`,animations:'disabled',fullPage:true});
await mobile.getByRole('button',{name:'결과 다운로드하기'}).click();
assert.equal(await mobile.locator('dialog .primary').first().textContent(),'이미지로 저장');
const mobileDownload=mobile.waitForEvent('download',{timeout:90000});await mobile.getByRole('button',{name:'이미지로 저장',exact:true}).click();await (await mobileDownload).saveAs(`${dir}/mobile-result.png-export.png`);
await mobile.getByRole('button',{name:'닫기',exact:true}).click();
await mobile.setViewportSize({width:320,height:700});
assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await mobile.emulateMedia({reducedMotion:'reduce'});
assert.equal(await mobile.locator('.result-character').evaluate(img=>getComputedStyle(img).animationName),'none');
assert.deepEqual(errors,[]);
await writeFile(`${dir}/report.json`,JSON.stringify({passed:true,errors,buttonLayout:buttons},null,2));
await browser.close();console.log('Browser verification passed: navigation, session recovery, desktop/mobile layout, PNG/PDF downloads, reset, guide modal.');
