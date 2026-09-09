import { STEPS, STEP_LABELS, OPTION_ICONS } from '../lib/diagnosis';
import { Emoji } from './Emoji';
export function Question({ step, selected, onSelect, onBack, onNext }: { step: number; selected: number | null; onSelect: (value: number) => void; onBack: () => void; onNext: () => void }) {
  const question = STEPS[step];
  const descriptions = question.desc as Record<string, string | undefined>;
  return <div className="container">
    <div className="topnav"><button className="back" aria-label="이전" onClick={onBack}>←</button><span className="count" aria-live="polite">{step + 1} / 4</span></div>
    <div className="progress" aria-label={`${step + 1}/4 단계`}>{STEPS.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}</div>
    <div className="question"><p className="step-label"><span className="step-number">0{step + 1}</span><span>{STEP_LABELS[step]}</span></p>
      <h1 tabIndex={-1} id="question-title">{question.title.split('<br>').map((line, i) => <span key={line}>{i > 0 && <br />}{i > 0 && <span className="desktop-space"> </span>}{line}</span>)}</h1>
      <p className="sub" id="question-description">{question.sub}</p>
    </div>
    <fieldset className="options" aria-labelledby="question-title" aria-describedby="question-description">
      {question.options.map((option, i) => <label className={`option ${selected === i ? 'selected' : ''}`} key={option}>
        <input type="radio" name={`question-${step}`} value={i} checked={selected === i} onChange={() => onSelect(i)} />
        <span className="oi"><Emoji name={OPTION_ICONS[step][i]} /></span><span className="label">{option}{descriptions[i] && <small>{descriptions[i]}</small>}</span><span className="check" aria-hidden="true">✓</span>
      </label>)}
    </fieldset>
    <div className="dock"><button className="primary" disabled={selected === null} onClick={onNext}>{step === 3 ? '결과 보기' : '다음'}</button></div>
  </div>;
}
