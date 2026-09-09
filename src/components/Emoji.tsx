import { EMOJI } from '../lib/diagnosis';
export function Emoji({ name }: { name: string }) {
  const value = EMOJI[name] ?? '📋';
  return <img className="product-icon toss-emoji" src={`/emoji/${value.codePointAt(0)!.toString(16)}.png`} alt="" aria-hidden="true" width={32} height={32} />;
}
