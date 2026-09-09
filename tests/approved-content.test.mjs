import { expect, it } from 'vitest';
import { getDiagnosis, STEPS } from '../src/lib/diagnosis';
import { cases, industries, situations, goals, paths } from './fixtures/approved.mjs';

it.each(cases)('matches independently transcribed result copy: $answers', c => {
 const result=getDiagnosis(c.answers);
 expect(result.top).toEqual(c.top);
 expect(result.products).toEqual(c.products);
 expect(result.advice.map(a=>a.content)).toEqual(c.advice);
 expect(result.advice.map(a=>a.context)).toEqual(c.contexts);
 expect([result.industry,result.path,result.situation,result.goal]).toEqual(c.chips);
 expect(result.provisionalBranch).toBe(c.advice.length===2);
});
it('uses the supplied questions and seven approved industries',()=>{
 expect(STEPS.map(s=>s.title.replaceAll('<br>',' '))).toEqual([
  '어떤 업종을 운영하고 계신가요?',
  '고객은 광고를 본 후, 주로 어디에서 구매하거나 예약하나요?',
  '지금 어떤 부분에서 가장 어려움을 느끼나요?',
  '지금 가장 이루고 싶은 목표는 무엇인가요?'
 ]);
 expect(STEPS.map(s=>s.options)).toEqual([industries,['매장으로 직접 방문','홈페이지 또는 자사몰에서 구매','예약 후 매장 방문','상담 후 구매/계약','배달앱 등 다른 플랫폼으로 구매/예약'],situations,goals]);
 expect(STEPS[0].desc).toEqual({4:'편의점, 슈퍼, 잡화점, 문구점, 꽃집, 가구점 등',6:'부동산 중개, 인테리어, 세탁소, 수리점, 청소, 자동차 관련 서비스 등'});
 expect(Object.values(STEPS[1].desc)).toEqual(paths);
 expect(Object.values(STEPS[2].desc)).toEqual(['애초에 고객이 잘 들어오지 않아요','고객이 들어오긴 하는데 관심을 보이지 않아요','관심은 보이는데 구매·예약·문의로 이어지지 않아요','한 번 이용 혹은 구매한 고객이 다시 찾아오지 않아요','광고를 해도 어떤 효과가 있었는지 모르겠어요']);
 expect(Object.values(STEPS[3].desc)).toEqual(['처음 방문하는 고객을 늘리고 싶어요','한 번 이용한 고객이 다시 찾아오게 하고 싶어요','더 많은 사람에게 우리 브랜드를 알리고 싶어요','고객과 지속적으로 소통하고 단골을 만들고 싶어요']);
});
