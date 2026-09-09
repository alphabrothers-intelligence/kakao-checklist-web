export function Intro({ onStart }: { onStart: () => void }) {
  return <div className="container intro">
    <div className="intro-copy">
      <p className="eyebrow">카카오 광고 자가진단</p>
      <h1 tabIndex={-1}>우리 가게에는<br /><span className="highlight">어떤 광고가 맞을까요?</span></h1>
      <p className="intro-description">우리 가게에 맞는 카카오 광고와<br />운영 방법을 알아보세요.</p>
      <div className="dock"><button className="primary" onClick={onStart}>광고 진단 시작하기 <span className="button-arrow" aria-hidden="true">→</span></button></div>
    </div>
    <div className="intro-visual object-stage orbit-stage" aria-hidden="true">
      <div className="orbit-line" /><div className="object-shadow" />
      <div className="orbit-item orbit-customer"><svg viewBox="30 155 375 435"><image href="/assets/advertising-orbit-3d-clean.png" width="1254" height="1254" /></svg></div>
      <div className="orbit-item orbit-message"><svg viewBox="835 195 400 370"><image href="/assets/advertising-orbit-3d-clean.png" width="1254" height="1254" /></svg></div>
      <div className="orbit-item orbit-location"><svg viewBox="475 815 310 380"><image href="/assets/advertising-orbit-3d-clean.png" width="1254" height="1254" /></svg></div>
      <img className="hero-object" src="/assets/shop-3d-clean.png" alt="" width="1254" height="1254" fetchPriority="high" />
    </div>
  </div>;
}
