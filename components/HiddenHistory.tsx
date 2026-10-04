export function HiddenHistory() {
  return (
    <section className="history-lock">
      <span className="lock" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <h2>История матчей скрыта</h2>
      <p>
        В клиенте Dota откройте свой профиль и включите «Общедоступная история матчей». Без этого данные по играм сюда не приходят.
      </p>
    </section>
  );
}
