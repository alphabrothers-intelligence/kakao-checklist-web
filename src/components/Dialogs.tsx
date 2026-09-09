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
export function GuideDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="광고 가이드 받아보기" onClose={onClose}>
    <p>가이드 연결을 준비하고 있어요.</p>
    <button className="guide" disabled><Emoji name="edu" /><span>나에게 필요한 메뉴얼 보러가기</span><small>준비 중</small></button>
    <button className="guide" disabled><Emoji name="bag" /><span>스타터킷 전체 보러가기</span><small>준비 중</small></button>
  </Modal>;
}
export function SaveDialog({ resultRef, onClose }: { resultRef: RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const busyRef = useRef(false);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  async function save(format: ExportFormat) {
    if (busyRef.current || !resultRef.current) return;
    busyRef.current = true; setBusy(true); setMessage('화면의 디자인과 이모지를 고해상도로 저장하고 있어요…');
    try {
      const result = await exportResult(resultRef.current, format);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(result.blob); urlRef.current = url;
      setFile({ url, name: result.filename });
      const link = document.createElement('a'); link.href = url; link.download = result.filename; document.body.append(link); link.click(); link.remove();
      setMessage('파일을 준비했어요. 저장이 시작되지 않으면 아래 링크를 눌러주세요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : '저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <Modal title="진단 결과 저장하기" busy={busy} onClose={onClose}>
    <p>화면에 나온 광고와 운영 방법을<br />이미지 또는 PDF로 저장해 두세요.</p>
    <button className="primary" disabled={busy} onClick={() => void save('png')}>이미지로 저장</button>
    <button className="primary close" disabled={busy} onClick={() => void save('pdf')}>PDF로 저장</button>
    <p className="save-status" role="status" aria-live="polite">{message}</p>
    {file && <div className="file-links"><a href={file.url} download={file.name}>파일 다운로드</a><a href={file.url} target="_blank" rel="noreferrer">파일 열기</a><small>모바일에서는 열린 파일의 공유 메뉴로 저장할 수 있어요.</small></div>}
  </Modal>;
}
