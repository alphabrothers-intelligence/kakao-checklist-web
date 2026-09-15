export function Intro({ onStart }: { onStart: () => void }) {
  return <div className="container intro brand-intro">
    <div className="intro-copy">
      <p className="intro-badge">광고 자가 진단 체크리스트</p>
      <h1 tabIndex={-1}>내 사업에는<br /><span className="highlight">어떤 광고가 맞을까요?</span></h1>
      <p className="intro-description">몇 가지 질문에 답하고<br />내 사업에 맞는 카카오 광고를 추천받아보세요.</p>
    </div>
    <div className="main-character-stage">
      <img className="main-characters" src="/kakao-main-characters.svg" alt="함께 인사하는 카카오 캐릭터들" fetchPriority="high" />
    </div>
      <div className="dock"><button className="primary" onClick={onStart}>광고 자가 진단 시작하기 <span aria-hidden="true">→</span></button></div>
  </div>;
}
