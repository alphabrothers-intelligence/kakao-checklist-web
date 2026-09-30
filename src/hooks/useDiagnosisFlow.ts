import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_ANSWERS, normalizeRoute, parseRoute, routePath, type Answers, type Route } from '../lib/diagnosis';
import { readAnswers, writeAnswers } from '../lib/session';
import { logOptionSelect } from '../lib/track';

export function useDiagnosisFlow() {
  const [answers, setAnswers] = useState<Answers>(readAnswers);
  const current = useRef(answers);
  const [route, setRoute] = useState<Route>(() => normalizeRoute(parseRoute(location.pathname), answers));
  const navigate = useCallback((next: Route, replace = false, values = current.current) => {
    const target = normalizeRoute(next, values);
    const url = routePath(target);
    if (replace || location.pathname !== url) history[replace ? 'replaceState' : 'pushState'](null, '', url + location.search);
    setRoute(target);
  }, []);
  useEffect(() => {
    const sync = () => {
      const next = normalizeRoute(parseRoute(location.pathname), current.current);
      if (routePath(next) !== location.pathname) history.replaceState(null, '', routePath(next) + location.search);
      setRoute(next);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const select = useCallback((step: number, option: number) => {
    const values: Answers = [...current.current]; values[step] = option;
    const is_change = current.current[step] !== null && current.current[step] !== option;
    current.current = values; setAnswers(values); writeAnswers(values);
    logOptionSelect(step, option, is_change);
  }, []);
  const restart = useCallback(() => {
    const values = EMPTY_ANSWERS(); current.current = values; setAnswers(values); writeAnswers(values);
    navigate({ screen: 'intro' }, true, values);
  }, [navigate]);
  return { answers, route, navigate, select, restart };
}
