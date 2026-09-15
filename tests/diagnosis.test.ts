import { describe, expect, it } from 'vitest';
import { getDiagnosis, isComplete, normalizeRoute, OPTION_COUNTS, parseRoute, RULES_VERSION, validAnswers, type CompleteAnswers } from '../src/lib/diagnosis';
import { readAnswers } from '../src/lib/session';

describe('provided diagnosis mapping', () => {
  it('returns complete, ordered results for all 600 allowed combinations', () => {
    let count = 0;
    for (let a = 0; a < 6; a++) for (let b = 0; b < 5; b++) for (let c = 0; c < 5; c++) for (let d = 0; d < 4; d++) {
      const value = getDiagnosis([a,b,c,d]);
      expect(value.top).toHaveLength(3); expect(value.products).toHaveLength(2);
      expect(new Set(value.products.map(p => p[0])).size).toBe(2);
      for (const advice of value.advice) expect(advice.content).toHaveLength(4);
      expect(value.advice.every(v => v.content.every(t => t.length > 0))).toBe(true);
      expect(value.guide).toMatch(/^https:\/\/alphabrothers\.notion\.site\/[0-9a-f]+$/);
      count++;
    }
    expect(count).toBe(OPTION_COUNTS.reduce((a,b) => a*b, 1));
  });
  it('preserves the user food/offline/acquisition example exactly', () => {
    const value = getDiagnosis([0,0,0,0]);
    expect(value.top.map(p => p[0])).toEqual(['카카오 비즈보드','키워드광고','채널 메시지']);
    expect(value.products.map(p => p[0])).toEqual(['우리매장 알리기','우리매장 맵광고']);
    expect(value.advice[0].key).toBe('0_0');
    expect(value.advice[0].content[1]).toBe('지도와 검색에 위치, 사진, 영업시간을 정확하게 채워보세요.');
  });
  it('keeps Q3 out of product selection, Q1 out of advice and products', () => {
    const base = getDiagnosis([0,1,0,0]);
    for (let s = 0; s < 5; s++) expect(getDiagnosis([0,1,s,0]).products).toEqual(base.products);
    for (let i = 0; i < 6; i++) {
      const result = getDiagnosis([i,1,0,0]);
      expect(result.products).toEqual(base.products); expect(result.advice).toEqual(base.advice);
    }
  });
  it('matches each of the 20 guides to its own Q2 x Q4 pair', () => {
    const guides = Array.from({length:5},(_,p)=>Array.from({length:4},(_,g)=>getDiagnosis([0,p,g===0?0:1,g]).guide));
    expect(new Set(guides.flat()).size).toBe(20);
    for (let p=0;p<5;p++) for (let g=0;g<4;g++) for (let i=0;i<6;i++) for (let s=0;s<5;s++) expect(getDiagnosis([i,p,s,g]).guide).toBe(guides[p][g]);
  });
  it('selects path-specific advice for every problem including reservation and platform', () => {
    for(let s=0;s<5;s++) expect(new Set(Array.from({length:5},(_,p)=>getDiagnosis([0,p,s,0]).advice[0].content[0])).size).toBe(5);
    expect(getDiagnosis([0,1,4,0]).advice[0].content[1]).toBe('예약 건수와 실제 방문(노쇼 제외) 건수를 나눠서 기록해보세요.');
    expect(getDiagnosis([0,3,2,0]).advice[0].content[0]).toContain('주문이나 예약');
  });
  it('rejects incomplete and invalid input instead of falling back to other industries', () => {
    for (const value of [[6,0,0,0],[-1,0,0,0],[0,5,0,0],[0,0,5,0],[0,0,0,4],[0,0,0,1.5],['0',0,0,0],[],null]) expect(validAnswers(value)).toBe(false);
    expect(isComplete([null,0,0,0])).toBe(false);
    expect(() => getDiagnosis([7,0,0,0] as CompleteAnswers)).toThrow();
  });
});
describe('session recovery and direct navigation', () => {
  it('recovers only valid current-version responses', () => {
    expect(readAnswers({ getItem: () => JSON.stringify({ version: RULES_VERSION, answers: [0,2,null,null] }) })).toEqual([0,2,null,null]);
    for (const stored of ['{broken',JSON.stringify({version:'2026-09-09.1',answers:[0,0,0,0]}),JSON.stringify({version:RULES_VERSION,answers:[99,0,0,0]})]) expect(readAnswers({getItem:()=>stored})).toEqual([null,null,null,null]);
    expect(readAnswers({getItem:()=>{throw Error('blocked')}})).toEqual([null,null,null,null]);
  });
  it('guards unanswered routes but permits revisiting completed questions', () => {
    expect(normalizeRoute({screen:'result'},[0,null,null,null])).toEqual({screen:'question',step:1});
    expect(normalizeRoute({screen:'question',step:3},[null,null,null,null])).toEqual({screen:'question',step:0});
    expect(normalizeRoute({screen:'question',step:0},[0,1,2,3])).toEqual({screen:'question',step:0});
    expect(parseRoute('#/question/9')).toEqual({screen:'intro'});
  });
});
