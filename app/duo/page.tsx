import Link from "next/link";
import { redirect } from "next/navigation";
import { PairForm } from "@/components/PairForm";
import { duoPath } from "@/lib/duo";
import { accountRefMessage, resolveAccountRef } from "@/lib/lookup";

export const dynamic = "force-dynamic";

export default async function DuoPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const first = await resolveAccountRef(params.a);
  const second = await resolveAccountRef(params.b);
  const firstError = params.a ? accountRefMessage(first) : null;
  const secondError = params.b ? accountRefMessage(second) : null;
  if (first.id !== null && second.id !== null && first.id !== second.id) redirect(duoPath(first.id, second.id));

  return (
    <main className="sheet">
      <section className="home-hero plain">
        <div>
          <h1>Дуэт</h1>
          <p className="lead">Сколько двое играют вместе и друг против друга.</p>
        </div>
        <PairForm action="/duo" a={params.a} b={params.b} submit="Открыть дуэт" />
        <p className="muted">
          Можно номер или ссылку steamcommunity.com. <Link href="/">Найти игрока</Link>
          {" · "}
          <Link href="/compare">Сравнение</Link> ставит два профиля рядом и общие матчи не считает.
        </p>
      </section>
      {firstError ? <p className="error">{firstError}</p> : null}
      {secondError ? <p className="error">{secondError}</p> : null}
      {first.id !== null && second.id !== null && first.id === second.id ? <p className="error">Нужны два разных игрока.</p> : null}
    </main>
  );
}
