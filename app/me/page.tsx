import Link from "next/link";
import { getSession } from "@/lib/current-session";
import { dota } from "@/lib/sources";
import { sessionUsesEphemeralSecret } from "@/lib/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  cancel: "Вход на стороне Steam отменён. Пароль сюда не приходил.",
  timeout: "Steam не успел подтвердить OpenID. Сессия не создана.",
  mismatch: "Адрес возврата не совпал с этим сайтом. Сессия не создана.",
  invalid: "Steam отклонил проверку входа. Сессия не создана.",
  auth: "Обновить профиль можно после входа через Steam.",
};

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; unlinked?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const profile = session ? await dota.getPlayer(session.accountId).catch(() => null) : null;
  const persona = profile?.data.profile?.personaname;

  return (
    <main className="sheet">
      <h1>Профиль</h1>
      <p className="lead">Вход через Steam нужен только чтобы обновлять свой обзор. Чужие профили открываются без входа.</p>
      {params.error ? <p className="error">{ERRORS[params.error] ?? "Вход не выполнен."}</p> : null}
      {params.unlinked === "1" ? <p className="banner">Steam отвязан. Войти можно снова.</p> : null}
      {sessionUsesEphemeralSecret() ? <p className="muted">Сессия пропадёт после перезапуска.</p> : null}

      {session ? (
        <>
          <p>
            Вошли как {persona || "игрок"}.
          </p>
          <p>
            <Link href={`/players/${session.accountId}`}>Мой обзор</Link>
          </p>
          <form action="/me/refresh" method="post">
            <button className="action" type="submit">
              Обновить
            </button>
          </form>
          <form action="/auth/logout" method="post">
            <button className="action" type="submit">
              Выйти
            </button>
          </form>
          <form action="/auth/unlink" method="post">
            <button className="action" type="submit">
              Отвязать Steam
            </button>
          </form>
        </>
      ) : (
        <>
          <p>Вы не вошли.</p>
          <p>
            <a className="action" href="/auth/steam">
              Войти через Steam
            </a>
          </p>
        </>
      )}
      <p>
        <Link href="/privacy">Конфиденциальность</Link>
      </p>
    </main>
  );
}
