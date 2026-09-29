import { useEffect, useRef, useState } from 'react';
import { useDiagnosisFlow } from './hooks/useDiagnosisFlow';
import { getDiagnosis, isComplete } from './lib/diagnosis';
import { Intro } from './components/Intro';
import { Question } from './components/Question';
import { Result } from './components/Result';
import { GuideDialog, SaveDialog } from './components/Dialogs';
import { logIntroView, logQuestionView, logResultView, logStartClick, logBackClick, logNextClick, logRestartClick, logOpenDownloadClick, logOpenGuideClick } from './lib/track';

export default function App() {
  const { answers, route, navigate, select, restart } = useDiagnosisFlow();
  const resultRef = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<'save' | 'guide' | null>(null);
  const routeKey = route.screen === 'question' ? `question-${route.step}` : route.screen;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    setDialog(null);
    if (route.screen === 'intro') logIntroView();
    if (route.screen === 'question') logQuestionView(route.step);
    if (route.screen === 'result' && isComplete(answers)) logResultView(answers);
  }, [routeKey]);
  return <main id="app">
    {route.screen === 'intro' && <Intro onStart={() => { logStartClick(); navigate({ screen: 'question', step: 0 }); }} />}
    {route.screen === 'question' && <Question key={route.step} step={route.step} selected={answers[route.step]} onSelect={value => select(route.step, value)} onBack={() => { logBackClick(route.step); navigate(route.step === 0 ? { screen: 'intro' } : { screen: 'question', step: route.step - 1 }); }} onNext={() => { if (answers[route.step] === null) return; logNextClick(route.step); navigate(route.step === 3 ? { screen: 'result' } : { screen: 'question', step: route.step + 1 }); }} />}
    {route.screen === 'result' && isComplete(answers) && <Result ref={resultRef} answers={answers} result={getDiagnosis(answers)} onRestart={() => { logRestartClick(answers); restart(); }} onSave={() => { logOpenDownloadClick(answers); setDialog('save'); }} onGuide={() => { logOpenGuideClick(answers); setDialog('guide'); }} />}
    {dialog === 'save' && isComplete(answers) && <SaveDialog resultRef={resultRef} answers={answers} onClose={() => setDialog(null)} />}
    {dialog === 'guide' && isComplete(answers) && <GuideDialog guide={getDiagnosis(answers).guide} answers={answers} onClose={() => setDialog(null)} />}
  </main>;
}
