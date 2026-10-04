import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="sheet">
      <h1>Конфиденциальность</h1>
      <p className="lead">Профили, матчи и ники публичные. Пароль Steam сюда не попадает.</p>
      <section className="block">
        <h2>Что видно всем</h2>
        <p>Матчи и ники открыты без входа. Отвязка Steam их не стирает.</p>
      </section>
      <section className="block">
        <h2>Вход</h2>
        <p>Кнопка Steam нужна, чтобы обновлять свой обзор. Сессия живёт в этом браузере.</p>
      </section>
      <p>
        <Link href="/me">Профиль</Link>
      </p>
    </main>
  );
}
