import { forwardRef } from 'react';
import { OPTION_ICONS, type CompleteAnswers, type Diagnosis } from '../lib/diagnosis';
import { Emoji } from './Emoji';

export const Result = forwardRef<HTMLDivElement, { result: Diagnosis; answers: CompleteAnswers; onRestart: () => void; onSave: () => void; onGuide: () => void }>(function Result({ result, answers, onRestart, onSave, onGuide }, ref) {
  return <div className="container result" ref={ref}>
    <p className="eyebrow">우리 가게를 위한 광고 가이드</p>
    <div className="result-emblem"><Emoji name="celebrate" /></div>
    <h1 tabIndex={-1}>우리 가게에 맞는 광고,<br /><span className="highlight">이렇게 시작해 보세요.</span></h1>
    <p className="lead">어떤 광고를 활용하고 무엇부터 개선하면 좋을지 알려드려요.</p>
    <div className="chips">{[result.industry, result.path, result.situation, result.goal].map(v => <span className="chip" key={v}>{v}</span>)}</div>
    <section className="rsection" aria-labelledby="industry-title">
      <span className="sectionno"><span className="section-index">01</span>우리 업종의 광고<span className="section-art"><Emoji name="chart" /></span></span>
      <h2 id="industry-title">우리 업종 사장님들이 사용하는<br /><span className="highlight">카카오 광고 TOP3</span></h2>
      <div className="rank-list">{result.top.map(([name, reason], i) => <div className="rank" key={name}><div className="ranknum">0{i + 1}</div><div><h3>{name}</h3><p>{reason}</p></div></div>)}</div>
    </section>
    <section className="rsection" aria-labelledby="advice-title">
      <span className="sectionno"><span className="section-index">02</span>지금 필요한 운영 방법<span className="section-art"><Emoji name="search" /></span></span>
      <h2 id="advice-title">지금 느끼고 있는 문제를 해결하고 싶다면,<br /><span className="highlight">아래와 같이 운영해보세요!</span></h2>
      {result.provisionalBranch && <p className="review-note">온라인·오프라인 안내를 함께 보여드려요. 우리 가게의 운영 방식에 맞는 내용을 확인해 주세요.</p>}
      {result.advice.map(({ key, content, context }) => <div className="advice" key={key}>
        {context && <div className="advice-context"><span>{context}</span></div>}
        <div className="advice-heading"><p className="advice-caption">발견된 항목</p><h3><span className="problem-icon"><Emoji name={OPTION_ICONS[2][answers[2]]} /></span><span className="problem-name">{content[0]}</span></h3></div>
        {content.slice(1).map((text, i) => <div className="advice-row" key={i}><h4><span>{['상황 해결', '구조 개선', '주의 사항'][i]}</span></h4><p>{text}</p></div>)}
      </div>)}
    </section>
    <section className="rsection" aria-labelledby="products-title">
      <span className="sectionno"><span className="section-index">03</span>우리 매장 유형에 맞는 광고<span className="section-art"><Emoji name="target" /></span></span>
      <h2 id="products-title">우리 매장 유형에 맞는<br /><span className="highlight">광고는?</span></h2>
      <p className="sub">{result.path}인 우리 가게,<br /><strong>{result.goal}</strong>를 위해 아래 광고 유형을 추천해요.</p>
      {result.products.map((name, i) => <div className="recommend" key={name}><span>{i + 1}</span>{name}</div>)}
    </section>
    <div className="actions" data-export-ignore>
      <button onClick={onRestart}>다시 진단하기</button><button className="save" onClick={onSave}>결과 저장하기 ↓</button><button className="guide-primary" onClick={onGuide}>광고 가이드 받아보기 →</button>
    </div>
    <p className="footnote">본 진단은 제공된 추천 기준에 따른 참고용 가이드입니다.</p>
  </div>;
});
