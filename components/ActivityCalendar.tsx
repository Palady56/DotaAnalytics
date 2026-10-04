import { buildActivity } from "@/lib/activity";
import type { ActivityMatch } from "@/lib/opendota";

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function tone(games: number, wins: number): string {
  if (games <= 0) return "";
  const rate = wins / games;
  if (rate >= 0.6) return "win";
  if (rate <= 0.4) return "loss";
  return "mix";
}

function size(games: number): string {
  if (games >= 4) return "s3";
  if (games >= 2) return "s2";
  return "";
}

function dayStamp(key: number): string {
  const date = new Date(key);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export function ActivityCalendar({ rows, truncated }: { rows: ActivityMatch[]; truncated: boolean }) {
  const weeks = buildActivity(rows);
  return (
    <div className="activity">
      <div className="activity-months">
        {weeks.map((week, index) => (
          <span key={index}>{week.label ?? ""}</span>
        ))}
      </div>
      <div className="activity-body">
        <div className="activity-days">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="activity-grid">
          {weeks.map((week, index) => (
            <div className="activity-week" key={index}>
              {week.days.map((day) => {
                const losses = Math.max(day.games - day.wins, 0);
                return (
                  <span className="heat-day" key={day.key}>
                    <i className={[tone(day.games, day.wins), size(day.games), day.future ? "future" : ""].filter(Boolean).join(" ")} />
                    {day.games > 0 ? (
                      <span className="heat-tip">
                        <b>{dayStamp(day.key)}</b>
                        <span>
                          <span className="win">{day.wins}</span>
                          {" – "}
                          <span className="loss">{losses}</span>
                        </span>
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {truncated ? <p className="muted">Показаны последние 500 матчей.</p> : null}
    </div>
  );
}
