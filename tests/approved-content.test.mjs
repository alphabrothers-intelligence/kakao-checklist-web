import { expect, it } from 'vitest';
import { getDiagnosis, STEPS } from '../src/lib/diagnosis';
import { cases, questions } from './fixtures/approved.mjs';
it.each(cases)('matches supplied September 15 result copy: $answers', c => {
 const result=getDiagnosis(c.answers);
 expect(result.top).toEqual(c.top);
 expect(result.products).toEqual(c.products);
 expect(result.advice.map(a=>a.content)).toEqual(c.advice);
 expect(result.advice).toHaveLength(1);
 expect([result.industry,result.path,result.situation,result.goal]).toEqual(c.chips);
});
it('uses the supplied questions, options and descriptions in order',()=>{
 expect(STEPS.map(({title,options,desc})=>({title,options,desc}))).toEqual(questions);
});
