import { useEffect, useRef, useState } from 'react';
import { useDiagnosisFlow } from './hooks/useDiagnosisFlow';
import { getDiagnosis, isComplete } from './lib/diagnosis';
import { Intro } from './components/Intro';
import { Question } from './components/Question';
import { Result } from './components/Result';
import { GuideDialog, SaveDialog } from './components/Dialogs';

export default function App() {
  const { answers, route, navigate, select, restart } = useDiagnosisFlow();
  const resultRef = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<'save' | 'guide' | null>(null);
  const routeKey = route.screen === 'question' ? `question-${route.step}` : route.screen;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    setDialog(null);
  }, [routeKey]);
  return <main id="app">
    {route.screen === 'intro' && <Intro onStart={() => navigate({ screen: 'question', step: 0 })} />}
    {route.screen === 'question' && <Question key={route.step} step={route.step} selected={answers[route.step]} onSelect={value => select(route.step, value)} onBack={() => navigate(route.step === 0 ? { screen: 'intro' } : { screen: 'question', step: route.step - 1 })} onNext={() => { if (answers[route.step] !== null) navigate(route.step === 3 ? { screen: 'result' } : { screen: 'question', step: route.step + 1 }); }} />}
    {route.screen === 'result' && isComplete(answers) && <Result ref={resultRef} answers={answers} result={getDiagnosis(answers)} onRestart={restart} onSave={() => setDialog('save')} onGuide={() => setDialog('guide')} />}
    {dialog === 'save' && <SaveDialog resultRef={resultRef} onClose={() => setDialog(null)} />}
    {dialog === 'guide' && <GuideDialog onClose={() => setDialog(null)} />}
  </main>;
}
