"use client";

type Option = { value: string; label: string };

export function MatchFiltersForm({
  accountId,
  values,
  patches,
  modes,
  lobbies,
  heroes,
}: {
  accountId: number;
  values: {
    patch: string;
    mode: string;
    lobby: string;
    hero: string;
    lane: string;
    result: string;
    side: string;
    days: string;
    with: string;
    broad: boolean;
  };
  patches: Option[];
  modes: Option[];
  lobbies: Option[];
  heroes: Option[];
}) {
  return (
    <form
      className="filters"
      action={`/players/${accountId}/matches`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        for (const [key, value] of data.entries()) {
          if (typeof value === "string" && value !== "") params.set(key, value);
        }
        const query = params.toString();
        window.location.assign(`/players/${accountId}/matches${query ? `?${query}` : ""}`);
      }}
    >
      <label>
        Патч
        <select name="patch" defaultValue={values.patch}>
          <option value="">все патчи</option>
          {patches.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Режим
        <select name="mode" defaultValue={values.mode}>
          <option value="">любой</option>
          {modes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Лобби
        <select name="lobby" defaultValue={values.lobby}>
          <option value="">любое</option>
          {lobbies.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Герой
        <select name="hero" defaultValue={values.hero}>
          <option value="">любой</option>
          {heroes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Линия
        <select name="lane" defaultValue={values.lane}>
          <option value="">любая</option>
          <option value="1">Safe lane</option>
          <option value="2">Mid lane</option>
          <option value="3">Off lane</option>
          <option value="4">Jungle</option>
          <option value="0">Не определена</option>
        </select>
      </label>
      <label>
        Результат
        <select name="result" defaultValue={values.result}>
          <option value="">любой</option>
          <option value="1">победа</option>
          <option value="0">поражение</option>
        </select>
      </label>
      <label>
        Сторона
        <select name="side" defaultValue={values.side}>
          <option value="">любая</option>
          <option value="1">Radiant</option>
          <option value="0">Dire</option>
        </select>
      </label>
      <label>
        Дней назад
        <select name="days" defaultValue={values.days}>
          <option value="">всё время</option>
          <option value="7">7</option>
          <option value="14">14</option>
          <option value="30">30</option>
          <option value="90">90</option>
          <option value="365">365</option>
        </select>
      </label>
      <label>
        С игроком
        <input name="with" defaultValue={values.with} inputMode="numeric" placeholder="ID игрока" />
      </label>
      <label className="check">
        <input type="checkbox" name="broad" value="1" defaultChecked={values.broad} />
        включая Turbo
      </label>
      <button type="submit">Показать</button>
    </form>
  );
}
