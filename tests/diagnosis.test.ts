import { describe, expect, it } from 'vitest';
import { ADVICE, getDiagnosis, isComplete, normalizeRoute, OPTION_COUNTS, parseRoute, RULES_VERSION, validAnswers, type CompleteAnswers } from '../src/lib/diagnosis';
import { readAnswers } from '../src/lib/session';

describe('provided diagnosis mapping', () => {
  it('returns complete, ordered results for all 700 allowed combinations', () => {
    let count = 0;
    for (let a = 0; a < 7; a++) for (let b = 0; b < 5; b++) for (let c = 0; c < 5; c++) for (let d = 0; d < 4; d++) {
      const value = getDiagnosis([a,b,c,d]);
      expect(value.top).toHaveLength(3); expect(value.products).toHaveLength(2);
      expect(new Set(value.products).size).toBe(2);
      for (const advice of value.advice) expect(advice.content).toHaveLength(4);
      expect(value.advice.every(v => v.content.every(t => t.length > 0))).toBe(true);
      count++;
    }
    expect(count).toBe(OPTION_COUNTS.reduce((a,b) => a*b, 1));
  });
  it('preserves the user food/offline/acquisition example exactly', () => {
    const value = getDiagnosis([0,0,0,0]);
    expect(value.top.map(p => p[0])).toEqual(['우리매장 맵광고','우리채널 알리기','채널 메시지']);
    expect(value.products).toEqual(['우리매장 알리기','카카오비즈보드']);
    expect(value.advice[0].key).toBe('noVisit_offline');
    expect(value.advice[0].content[1]).toContain('근처 손님도 우리 매장을 모르고 있어요.');
  });
  it('keeps Q3 out of product selection, Q1 out of advice and products', () => {
    const base = getDiagnosis([0,1,0,0]);
    for (let s = 0; s < 5; s++) expect(getDiagnosis([0,1,s,0]).products).toEqual(base.products);
    for (let i = 0; i < 7; i++) {
      const result = getDiagnosis([i,1,0,0]);
      expect(result.products).toEqual(base.products); expect(result.advice).toEqual(base.advice);
    }
  });
  it('preserves the unresolved dual branch without inventing content', () => {
    expect(getDiagnosis([0,3,0,0]).advice.map(v => v.key)).toEqual(['noVisit_online','noVisit_offline']);
    expect(getDiagnosis([0,3,2,0]).advice.map(v => v.content)).toEqual([ADVICE.noConvert]);
    expect(getDiagnosis([0,4,4,3]).advice.map(v => v.key)).toEqual(['noMeasure_online','noMeasure_offline']);
  });
  it('rejects incomplete and invalid input instead of falling back to other industries', () => {
    for (const value of [[7,0,0,0],[-1,0,0,0],[0,5,0,0],[0,0,5,0],[0,0,0,4],[0,0,0,1.5],['0',0,0,0],[],null]) expect(validAnswers(value)).toBe(false);
    expect(isComplete([null,0,0,0])).toBe(false);
    expect(() => getDiagnosis([7,0,0,0] as CompleteAnswers)).toThrow();
  });
});
describe('session recovery and direct navigation', () => {
  it('recovers only valid current-version responses', () => {
    expect(readAnswers({ getItem: () => JSON.stringify({ version: RULES_VERSION, answers: [0,2,null,null] }) })).toEqual([0,2,null,null]);
    for (const stored of ['{broken',JSON.stringify({version:'old',answers:[0,0,0,0]}),JSON.stringify({version:RULES_VERSION,answers:[99,0,0,0]})]) expect(readAnswers({getItem:()=>stored})).toEqual([null,null,null,null]);
    expect(readAnswers({getItem:()=>{throw Error('blocked')}})).toEqual([null,null,null,null]);
  });
  it('guards unanswered routes but permits revisiting completed questions', () => {
    expect(normalizeRoute({screen:'result'},[0,null,null,null])).toEqual({screen:'question',step:1});
    expect(normalizeRoute({screen:'question',step:3},[null,null,null,null])).toEqual({screen:'question',step:0});
    expect(normalizeRoute({screen:'question',step:0},[0,1,2,3])).toEqual({screen:'question',step:0});
    expect(parseRoute('#/question/9')).toEqual({screen:'intro'});
  });
});
