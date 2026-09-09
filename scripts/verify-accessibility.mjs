import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5174/');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(await page.locator('.hero-object').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.getByRole('button',{name:'광고 진단 시작하기'}).click();
 await page.getByRole('radio').first().focus();await page.keyboard.press('ArrowDown');
 assert.equal(await page.getByRole('radio',{name:'미용/뷰티',exact:true}).isChecked(),true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const outline=await page.getByRole('radio',{name:'미용/뷰티',exact:true}).evaluate(input=>getComputedStyle(input.parentElement).outlineStyle);
 assert.equal(outline,'none');
 await page.getByRole('button',{name:'다음',exact:true}).focus();await page.keyboard.press('Enter');
 await page.getByRole('heading',{name:'고객은 주로 어디에서 구매하거나 예약하나요?'}).waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'H1');
 console.log('Keyboard selection, visible single focus cue, narrow viewport, reduced motion, and heading focus passed.');
}finally{await browser.close()}
