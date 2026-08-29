/** Boot loader, logo + barre. Styles dans index.html. */
export default function Loading() {
  return (
    <div className="myswym-boot" role="status" aria-live="polite" aria-busy="true">
      <div className="myswym-boot-inner">
        <div className="myswym-boot-icon-wrap">
          <img className="myswym-boot-icon" src="/apple-touch-icon.png" alt="" width={88} height={88} />
        </div>
        <img className="myswym-boot-wordmark" src="/logo-myswym-banner-blanc.png" alt="mySWYM" height={28} width={192} />
        <p className="myswym-boot-status">Préparation de votre espace nageur</p>
        <div className="myswym-boot-track" aria-hidden="true"><div className="myswym-boot-bar" /></div>
        <p className="myswym-boot-label">Un instant</p>
      </div>
    </div>
  );
}
