import Link from "next/link";

export default function NotFound() {
  return (
    <main className="sheet">
      <h1>Такой страницы нет</h1>
      <p>
        <Link href="/">Вернуться к поиску игрока</Link>
      </p>
    </main>
  );
}
