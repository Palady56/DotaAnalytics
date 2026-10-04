export function PairForm({
  action,
  a,
  b,
  submit,
}: {
  action: string;
  a?: string;
  b?: string;
  submit: string;
}) {
  return (
    <form className="pair-form" action={action}>
      <input name="a" defaultValue={a ?? ""} placeholder="Ссылка Steam или ID" aria-label="Первый игрок" />
      <input name="b" defaultValue={b ?? ""} placeholder="Ссылка Steam или ID" aria-label="Второй игрок" />
      <button type="submit">{submit}</button>
    </form>
  );
}
