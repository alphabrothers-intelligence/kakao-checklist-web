import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_ANSWERS, normalizeRoute, parseRoute, routeHash, type Answers, type Route } from '../lib/diagnosis';
import { readAnswers, writeAnswers } from '../lib/session';

export function useDiagnosisFlow() {
  const [answers, setAnswers] = useState<Answers>(readAnswers);
  const current = useRef(answers);
  const [route, setRoute] = useState<Route>(() => normalizeRoute(parseRoute(location.hash), answers));
  const navigate = useCallback((next: Route, replace = false, values = current.current) => {
    const target = normalizeRoute(next, values);
    const url = routeHash(target);
    if (replace || location.hash !== url) history[replace ? 'replaceState' : 'pushState'](null, '', url);
    setRoute(target);
  }, []);
  useEffect(() => {
    const sync = () => {
      const next = normalizeRoute(parseRoute(location.hash), current.current);
      if (routeHash(next) !== location.hash) history.replaceState(null, '', routeHash(next));
      setRoute(next);
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);
  const select = useCallback((step: number, option: number) => {
    const values: Answers = [...current.current]; values[step] = option;
    current.current = values; setAnswers(values); writeAnswers(values);
  }, []);
  const restart = useCallback(() => {
    const values = EMPTY_ANSWERS(); current.current = values; setAnswers(values); writeAnswers(values);
    navigate({ screen: 'intro' }, true, values);
  }, [navigate]);
  return { answers, route, navigate, select, restart };
}
