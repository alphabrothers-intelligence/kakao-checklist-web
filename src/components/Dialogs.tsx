import { useEffect, useRef, useState, type RefObject, type ReactNode } from 'react';
import { Emoji } from './Emoji';
import { exportResult, type ExportFormat } from '../lib/exportResult';

function Modal({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === ref.current && !busy) { const r = ref.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <h2>{title}</h2>{children}<button className="textbtn" onClick={onClose} disabled={busy}>닫기</button>
  </dialog>;
}
export function GuideDialog({ guide, onClose }: { guide: string; onClose: () => void }) {
  return <Modal title="광고 가이드 확인하기" onClose={onClose}>
    <div className="guide-options">
    <a className="guide" href={guide} target="_blank" rel="noopener noreferrer"><Emoji name="edu" /><span>나에게 딱 맞는 광고 가이드 확인하기</span></a>
    <button className="guide" disabled><Emoji name="bag" /><span>스타터킷 전체 보러가기</span><small>준비 중</small></button>
    </div>
  </Modal>;
}
export function SaveDialog({ resultRef, onClose }: { resultRef: RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const [mobile] = useState(() => matchMedia('(max-width: 767px)').matches);
  const formats: ExportFormat[] = mobile ? ['png', 'pdf'] : ['pdf', 'png'];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  async function save(format: ExportFormat) {
    if (busyRef.current || !resultRef.current) return;
    busyRef.current = true; setBusy(true); setMessage('선택한 형식에 맞춰 고해상도 결과를 저장하고 있어요…');
    try {
      const result = await exportResult(resultRef.current, format);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(result.blob); urlRef.current = url;
      const link = document.createElement('a'); link.href = url; link.download = result.filename; document.body.append(link); link.click(); link.remove();
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <Modal title="결과 다운로드하기" busy={busy} onClose={onClose}>
    <p>테스트 결과 및 광고 추천 내용을<br />이미지 또는 PDF로 저장해 두세요.</p>
    {formats.map((format, i) => <button key={format} className={`primary ${i ? 'close' : ''}`} disabled={busy} onClick={() => void save(format)}>{format === 'png' ? '이미지로 저장' : 'PDF로 저장'}</button>)}
    <p className="save-status" role="status" aria-live="polite">{message}</p>
  </Modal>;
}
