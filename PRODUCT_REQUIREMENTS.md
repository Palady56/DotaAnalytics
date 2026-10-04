# Dota Player Intelligence — Product Requirements Document

**Статус:** research + product spec. Реализация запрещена этим документом.  
**Дата research:** 29 сентября 2026.  
**Официальный gameplay patch на эту дату:** **7.41f**, опубликован 15 сентября 2026 (Dota 2 news / Steam News, build 25329722).  
**Аналитический patch bucket, который реально отдают OpenDota и Dotabuff:** **7.41**, id `60`, дата в `GET /constants/patch` — `2026-03-24`. Буквенные 7.41a–7.41f отдельными id не существуют.  
**Рабочее имя продукта:** Player Intelligence. Сигнатурный модуль: Duo.  
**Код, SQL, стек и файлы реализации в этом документе отсутствуют намеренно.**

Легенда достоверности:

| Метка | Значение |
|---|---|
| VERIFIED | Вызвано или прочитано с живой страницы/API 29 сентября 2026 |
| DOCUMENTED | Есть в актуальной документации или UI, в этой сессии endpoint не переисполнялся |
| UNVERIFIED | Правдоподобно, но точная схема, лимит или смысл поля не подтверждены |
| STALE | Публичный текст противоречит более свежему источнику |

---

# Research Findings

## DOTABUFF

Наблюдалось 29 сентября 2026 на живом сайте.

**Навигация:** Home, Esports, Heroes, Items, Players, Matches, Blog, Forums, Plus. Поиск: heroes, items, players, leagues, teams. Вход: Sign in with Steam.

**Heroes**

- Подразделы: All Heroes, Meta, Trends, Lanes, Most Played, Win Rate, Game Impact, Economy.
- Фильтры на `/heroes`: Group by **Heroes / Facets**; Date range (7/14/30 дней, 3/6/12 месяцев, **Patch 7.41** и более старые патчи, включая исторические буквенные вроде 7.07d); Game mode **All Pick / Turbo**; Rank tier All + Herald…Immortal; Position: All и пять иконок (текстовых подписей в DOM нет, визуально это 5 позиций).
- Представления: Meta snapshot, Popular heroes, Winning heroes, Combat, Vision.
- Колонки meta-таблицы: Hero, Tier, Win rate, Change, Pick rate, Ban rate.
- Текст страницы прямо обещает фильтр position + rank + game mode + date range.

**Hero page** (`/heroes/anti-mage`)

- Tabs: Overview, Guides, Items, Counters, Clips, Ability Builds, Abilities, Trends, Player Rankings.
- Блоки: lane presence / win rate / KDA / GPM / XPM; facet win rate и KDA; items с matches/wins; advantage и disadvantage; player rankings с Hero Score; period и duration.
- Freshness: «Last Updated 37 minutes ago».
- Hero Score — чужая proprietary-метрика. Не копировать имя и формулу.

**Player** (`/players/{account_id}`)

- Tabs: Overview, Matches, Heroes, Hero Mastery, Items, Records, Scenarios, Activity, Trends, Achievements, Matchups.
- Header: last match, record вида wins–losses–третье число, win rate.
- Roles and lanes подписаны **«from recently analyzed matches»**, не lifetime. Пример структуры: доля Core, Off Lane / Safe Lane / Mid Lane.
- Most played heroes: matches, win %, KDA, role, lane, last played.
- Freshness на просмотренном профиле: «Last Updated 14 minutes ago».
- **Match history (`/players/{id}/matches`) закрыта:** «Sign in with Steam to view this page. This helps us prevent abuse».
- Часть дорогих функций закрыта Dotabuff Plus.

**Сильные UX-идеи:** patch/date как первоклассный фильтр; ban rate рядом с pick/win; facet как ось группировки; freshness в минутах; role/lane явно помечены как выборка parsed matches, а не вся история.

**Ограничение для нас:** Dotabuff не является API-источником. Скрейпинг не проектируется. Это референс категорий аналитики и UX.

## OPENDOTA

**Сайт**, игрок `account_id` 86745912, 29 сентября 2026.

- Глобальная навигация: Request, Matches, Heroes, Teams, Explorer, Combos, Medals, Records, Scenarios, API, Subscribe.
- Поиск: «player name, match ID».
- Player tabs: Overview, Matches, Heroes, Peers, Pros, Records, Totals, Counts, Histograms, Trends, Wardmap, Wordcloud, Medals, Rankings, Activity.
- Фильтры на профиле: Hero, Side, Result, Lane, Patch, Game Mode, Lobby Type, Date, Region, Allied Heroes, Opposing Heroes, **Included Account ID**, **Excluded Account ID**, Insignificant, **Party Size**, переключатель Turbo.
- Overview показывает пары average / maximum: win rate, kills, deaths, assists, GPM, XPM, last hits, hero damage, healing, tower damage, duration.
- Есть кнопка Refresh.
- `GET /players/{id}/wl` для этого аккаунта вернул `win: 1945, lose: 1190`. Это не совпадает ни с Dotabuff-record другого игрока, ни со STRATZ-счётчиком того же аккаунта (см. ниже). Default significant-выборка исключает часть режимов, включая Turbo, пока фильтр не снят.

**API, вызванные в этой сессии** (`https://api.opendota.com/api`):

| Endpoint | Результат |
|---|---|
| `GET /metadata` | `freeCallLimit: 3000`, `freeRateLimit: 60`, `premRateLimit: 3000` |
| `GET /constants/patch` | Последняя запись: `7.41`, id `60`, `2026-03-24`. Буквы 7.41a–f отсутствуют |
| `GET /constants/game_mode` | id 0–25, включая `22 game_mode_all_draft`, `23 game_mode_turbo` |
| `GET /players/{account_id}` | profile, `rank_tier`, `leaderboard_rank`, `computed_mmr`, `computed_mmr_turbo`, `aliases`, `fh_unavailable` |
| `GET /players/{account_id}/wl` | `{win, lose}` |
| `GET /players/{account_id}/recentMatches` | 20 матчей, поля ниже |
| `GET /players/{account_id}/matches?included_account_id=&limit=1` | Общие матчи и карта 10 героев |
| `GET /players/{account_id}/peers` | `with_*` и `against_*` |
| `GET /schema` | Колонки Postgres, включая parsed-поля |
| `GET /heroStats` | HTTP 200, ~161 KB. Имена полей в этой сессии не извлечены → **UNVERIFIED field names** |
| `GET /constants`, `/constants/facets`, `/constants/lane_roles` | 404 |

**Поля `recentMatches`, VERIFIED:** `match_id`, `player_slot`, `radiant_win`, `hero_id`, `start_time`, `duration`, `game_mode`, `lobby_type`, `version`, `kills`, `deaths`, `assists`, `average_rank`, `xp_per_min`, `gold_per_min`, `hero_damage`, `tower_damage`, `hero_healing`, `last_hits`, `lane`, `lane_role`, `is_roaming`, `cluster`, `leaver_status`, `party_size`, `hero_variant`.

В выборке: `game_mode` 22 + `lobby_type` 7 = ranked All Pick-поток; один матч `game_mode` 2 + `lobby_type` 1 + `party_size` 10. `hero_variant` во всех 20 матчах равен `0` — смысл 0 (первый facet или «нет данных») **UNVERIFIED**. `denies`, items, net worth, abilities в `recentMatches` нет.

**`peers`, VERIFIED:** `account_id`, `last_played`, `win`, `games`, `with_win`, `with_games`, `against_win`, `against_games`, `with_gpm_sum`, `with_xpm_sum`, `personaname`, `name`, avatars. Это lifetime-агрегат «вместе / против». Нет патча, героев, ролей, party.

**`matches?included_account_id`, VERIFIED:** возвращает матч и `heroes` по слотам `{account_id, hero_id}` для всех 10 игроков. Сторона определяется по `player_slot` (`< 128` Radiant). Это рабочая основа Duo. `party_id` в этом ответе не было.

**Schema `player_matches`, VERIFIED как колонки БД, не как гарантия каждого API-ответа:** `party_id`, `party_size`, `lane`, `lane_role`, `is_roaming`, `teamfight_participation`, `hero_variant`, `net_worth`, `obs_log`, `sen_log`, `purchase_log`, `ability_upgrades_arr`, `gold_t`, `xp_t`, `lh_t`, objectives-related counters. Полный набор есть у **parsed** матча (`version` не null). Неparsed матч этих полей не имеет.

**Документированные, но не переисполненные в сессии endpoint'ы** (официальный API reference / UI): `/players/{id}/heroes`, `/players/{id}/pros`, `/players/{id}/totals`, `/players/{id}/counts`, `/players/{id}/histograms/{field}`, `/players/{id}/wardmap`, `/players/{id}/wordcloud`, `/players/{id}/ratings`, `/players/{id}/rankings`, `/heroes`, `/heroes/{id}/matchups`, `/heroes/{id}/durations`, `/heroes/{id}/players`, `/heroes/{id}/itemPopularity`, `/benchmarks`, `/publicMatches`, `/distributions`, `/scenarios/laneRoles`, `/scenarios/misc`, `/proMatches`, `/proPlayers`, `/search`, `/explorer`, `/request/{match_id}`. Кнопка Refresh на профиле есть; точный path `POST /players/{id}/refresh` в этой сессии **не вызывался** (нельзя ставить чужой refresh) → **UNVERIFIED exact path**.

**Query parameters игрока, DOCUMENTED и отражённые в UI:** `limit`, `offset`, `win`, `patch`, `game_mode`, `lobby_type`, `region`, `date`, `lane_role`, `hero_id`, `is_radiant`, `included_account_id`, `excluded_account_id`, `with_hero_id`, `against_hero_id`, `significant`, `having`, `sort`, `project`. Параметр `project` в этой сессии не проверялся.

**Lane role, DOCUMENTED** на `/scenarios/laneRoles`: `1` Safe, `2` Mid, `3` Off, `4` Jungle. Это lane role, не Position 1–5. `is_roaming` — отдельный boolean.

**Лимиты — конфликт источников:**

| Источник | Число | Статус |
|---|---|---|
| Живой `GET /metadata` 29.09.2026 | freeCallLimit 3000, free 60/min, premium 3000/min | VERIFIED как поля metadata. Единица 3000 (день или месяц) в самом JSON не подписана |
| `config.ts` репозитория odota/core | комментарий: 3000 requests **per day** до 429; без ключа 60/min; с ключом default 300/min; сверх free при ключе тарифицируются | VERIFIED как default в репозитории. Production overrides возможны |
| Комментарий мейнтейнера, май 2025 | IP без корректного ключа: **2000/day**, сброс в UTC | DOCUMENTED, может отличаться от текущего metadata |
| Старый swagger-текст | 50 000/month и 60/min с 2018-04-22 | STALE относительно metadata и config |

Проектировать под жёсткий конверт: **60 запросов/мин без ключа, дневной IP-cap порядка 2–3 тысяч, production-объём только с ключом и кэшем.** Обход лимитов не проектируется.

**Explorer** — произвольный SQL. Для продукта не использовать как пользовательский вход. Риск злоупотребления и нестабильная стоимость запроса.

**Парсинг:** `version: null` означает, что replay ещё не разобран. OpenDota config содержит `DISABLE_REAPI: "1"` с комментарием, что повторный Steam `GetMatchDetails` отключён, потому что endpoint сломан. Это ограничение Valve-fallback, не повод его «починить» обходом.

## STRATZ

Наблюдалось 29 сентября 2026.

**Навигация:** R.O.S.H., Heroes, Players, Matches, Leagues; дополнительно Battle Pass, Road to Grandmaster, Guilds, Leaderboards, Knowledge Base, Special Events, API, STRATZ+, GraphQL API. Сайт бесплатный для чтения. Вход: Log in with Steam.

**Heroes overview:** вкладки Overview, Meta, Guides. Позиции названы Safe Lane, Mid Lane, Off Lane, Soft Support, Hard Support, у каждой показан win rate лидера линии. Фильтр атрибута: Strength, Agility, Intelligence, Universal. URL героя числовой: `/heroes/{heroId}`.

**Hero meta** (`/heroes/meta`): вкладки Overview, Meta, Trends, Lanes, Positions, Guides. Фильтры: окно (на экране «8 Days»), rank tiers, positions, regions, game modes. Колонки: Win Rate start / current / delta / average; Pick Rate start / current / delta / average; ratio; match count. **Ban rate в извлечённых колонках этого экрана не было.** Заголовок страницы содержал «Unknown». Диапазон данных на экране: **11–18 сентября**, «Last updated 2 weeks ago». На 29 сентября это отставание от 7.41f (15 сентября) и от даты research. Продукт не должен показывать такой срез как «текущую мету» без freshness badge.

**Player** (`/players/86745912` редирект на slug): вкладки Overview, Matches, Heroes, Activity, Peers, Progression, Conduct, Breakdown. Фильтры: Exclude turbo, All time, heroes, positions, game modes, lobby types, **Solo/Party**, leagues. Overview: команда, роль Safe Lane, matches, first match, win rate, W–L. На матчах виден знаковый модификатор (`+23`, `-8`) — чужой performance score. Имя и формулу не копировать.

**Критичное наблюдение приватности:** для того же `account_id` STRATZ показал «This profile is private. Only public league matches are shown» и предлагал логин для Private Access. OpenDota при этом отдал недавние ranked public matches и `rank_tier` 80 / `leaderboard_rank` 379. **Один и тот же аккаунт не равен одному и тому же объёму данных.** STRATZ-ранг на странице был региональным (Americas 321) и не совпал с OpenDota `leaderboard_rank` 379. `computed_mmr` OpenDota был около 4108 при Immortal leaderboard — это оценка, не официальный MMR.

**API, VERIFIED по публичной странице `/api` и GraphiQL:**

- Переход с REST на GraphQL. Endpoint: `https://api.stratz.com/graphql`.
- Playground: `https://api.stratz.com/graphiql`.
- Токен после входа Steam. Header `Authorization: Bearer`. Страница требует `User-Agent: STRATZ_API`.
- Типы токенов: Default (личный тест), Individual (приложение), Multi (токен на пользователя десктоп-клиента).
- Лимиты считаются per second / minute / hour / day. Остаток виден в My Tokens.

**Rate limits из knowledge-base issue (2020–2021), STALE до сверки с текущей таблицей токена:**

| Token | /sec | /min | /hour | /day |
|---|---:|---:|---:|---:|
| Default | 20 | 250 | 2 000 | 10 000 |
| Individual | 20 | 250 | 4 000 | 20 000 |
| Multi | 20 | 20 per user | 50 per user | 100 per user |

Имена GraphQL-полей в этой сессии **не интроспектировались** (нужен Bearer). Любое конкретное поле STRATZ, не увиденное в UI, помечено **UNVERIFIED — needs API validation**. Интроспекция делается на этапе реализации с собственным токеном, без угадывания имён.

STRATZ строит поверх сырого матча: позицию (1–5 / lane labels), facet-aware и position-aware мету, тренд start→current внутри окна, гайды из успешных игр, guilds, региональный leaderboard, знаковый match performance, разделение Solo/Party. Часть этого недоступна, если профиль private и зритель не владелец.

## Расхождение одного аккаунта — правило продукта

Один публичный `account_id` 29 сентября 2026:

| Факт | OpenDota | STRATZ |
|---|---|---|
| Текущее отображаемое имя | persona + другой `profile.name` | профессиональное имя и команда |
| Объём матчей | недавние ranked public + wl 1945–1190 | «private», только public league matches; на экране 15 346 матчей и 55.86% |
| Ранг | `rank_tier` 80, `leaderboard_rank` 379 | Americas leaderboard 321 |
| MMR | `computed_mmr` ≈ 4108 | официальное число MMR на экране не извлекалось |

Вывод: цифры сервисов расходятся, потому что различаются охват (public parse vs private GC vs league-only), фильтр significant/turbo, регион лидерборда и то, является ли число оценкой. Продукт выбирает один source of truth на метрику и показывает период.

## Steam / Valve

**VERIFIED по Steamworks:**

- Web login: OpenID 2.0, OP endpoint `https://steamcommunity.com/openid/`.
- После проверки Claimed ID имеет вид `https://steamcommunity.com/openid/id/<SteamID64>`.
- Пользователь вводит пароль только на стороне Steam. Наш сервис пароль не видит и не хранит.
- Проверка `openid.mode=check_authentication` делается сервером. Повтор той же проверки недействителен.
- Steam Web API key: до **100 000 вызовов в день** по Steam Web API Terms of Use. Ключ привязан к приложению. Valve может изменить или закрыть API.
- `ISteamUser/ResolveVanityURL` резолвит custom URL `/id/{vanity}`.
- `ISteamUser/GetPlayerSummaries` отдаёт публичный профиль (имя, аватар, profile URL). Batch до 100 SteamID на вызов — DOCUMENTED community/API lists, не переисполнялось.
- `IDOTA2Match_570/GetMatchHistory`: `matches_requested` максимум 100; `account_id` **падает, если match history скрыта**.
- `GetMatchDetails` остаётся в supported list при передаче ключа, но OpenDota считает повторные вызовы сломанными после изменений игры. Для аналитики это fallback, не склад.

**Friend Code:** официального endpoint «friend code → SteamID» в Steamworks нет. Community-алгоритмы существуют для CS-кодов и коротких `s.team/p/{code}/{token}`. Это не контракт Valve. Friend Code — optional convenience, не идентификатор Dota API.

**Связка id, VERIFIED на живой паре полей OpenDota:** `account_id = SteamID64 - 76561197960265728`. Dota/OpenDota API ждут 32-bit `account_id`, не SteamID64.

## Что значит public

Public match — матч, который Valve отдала в публичную историю / replay pipeline и который парсер успел забрать. Это не «все игры аккаунта».

Может отсутствовать:

- матчи при скрытой истории (Steam `GetMatchHistory` падает; STRATZ показывает только league matches);
- anonymous игроки (`account_id: null`);
- неparsed replay: нет ward map, ability build, lane_pos, purchase timings, teamfights;
- буквенный патч;
- официальный MMR;
- доказательство party, если есть только `party_size` или факт одной команды;
- полная история (`fh_unavailable: true`, `full_history_time`).

Поэтому lifetime и recent, patch и rank, ranked и turbo не смешиваются без подписи. Sample size показывается всегда, когда на нём строится сравнение или ярлык «лучший».

---

# Feature Map

## Shared by competitors

Профиль игрока, история матчей, герои игрока, win rate, KDA, GPM/XPM, ранг, hero meta с win/pick, страницы героя, матч, поиск, Steam login, фильтр режима и патча в том или ином виде.

## Best-in-class ideas

| Идея | Где сильнее | Почему |
|---|---|---|
| Ban rate + facet grouping + patch dropdown | Dotabuff | Мета читается за один экран |
| Freshness в минутах | Dotabuff | Пользователь видит задержку |
| Included account, with/against, query-фильтры | OpenDota | Единственный подтверждённый бесплатный способ построить Duo |
| Parsed replay: wards, items timings, abilities | OpenDota schema | Глубина матча без чужого score |
| Position 1–5, Solo/Party, start→current тренд | STRATZ | Производные сущности поверх матча |
| Private vs public явно сказано | STRATZ | Не притворяется, что история полная |

## Missing opportunity

Ни один из трёх не делает одновременно:

- честный Duo (same team отдельно от same party, с sample и baseline);
- player-vs-meta в том же bracket / position / mode / patch;
- персональную мету как пересечение силы игрока и текущей меты;
- единый source of truth, когда OpenDota, STRATZ и Dotabuff расходятся.

Dotabuff прячет match history за логин зрителя. OpenDota отдаёт фильтры без истории «что это значит». STRATZ глубже, но private profile и proprietary score закрывают часть ответа, а мета на дату research была не свежей.

## Unique product opportunity

**Player Intelligence:** паспорт игрока из проверяемых срезов, а не ещё одна таблица win rate. Сигнатура — Duo story плюс дельта к мете своего среза. Чужие Hero Score / IMP-подобные числа не используются.

Гипотеза «Dota Analytics Passport» принимается как каркас и сужается. «Кто я как игрок» допускается только как **Playstyle Profile** из измеряемых долей (роль, пул героев, длительность, темп), без психологических ярлыков. Сильная концепция:

> Публичный аналитический паспорт: как я играю в заявленном срезе, где мой результат отличается от меты этого среза, и что происходит, когда я играю с конкретным вторым игроком.

---

# 1. Executive Summary

Продукт отвечает на три вопроса: «как я играю», «что сейчас в мете моего среза», «что происходит, когда мы играем вдвоём».

Основа данных MVP — **OpenDota** для матчей, игрока и Duo, **Steam OpenID + Steam Web API** для личности. **STRATZ** — P1-обогащение позиции, facet-меты и party только после интроспекции схемы своим токеном. Dotabuff — референс UX, не источник.

Первым строится lookup + обзор игрока + матчи + герои со sample warnings + базовая мета + страница матча + сравнение двух профилей + базовый Duo. Не строится первым: собственный парсер реплеев, composite score, AI-тексты, буквенный патч 7.41f как отдельная статистика, Position 1–5 как факт, если источник дал только lane role.

Главный риск — не дизайн, а честность: `computed_mmr`, significant-фильтр, private profile и патч без буквы легко показать как точные числа. Каждое такое число маркируется.

---

# 2. Product Vision

Пользователь находит игрока без пароля Steam. Сервис собирает публичные данные и раскладывает их на три слоя: мгновенный вывод, исследование, сырые ряды.

Duo — не таблица peers. После выбора двух игроков продукт рассказывает: сколько матчей в одной команде, чем это отличается от их одиночного baseline, какие пары героев и ролей повторяются, что из этого видно на текущем patch bucket, и где выборка слишком мала для вывода.

Мета — не список сырого win rate. Сортировка «сильнее в этом срезе» идёт по нижней границе доверительного интервала и всегда показывает объём выборки.

Персональный слой — пересечение силы игрока, его роли, его bracket и текущего patch bucket. Это «ваша мета», не «мета вообще».

---

# 3. Target Users

| Сегмент | Задача | Что им нельзя врать |
|---|---|---|
| Обычный игрок | Понять свой пул, форму, роль | Маленькая выборка не называется «лучшиий герой» |
| Пара друзей | Понять, вдвоём они сильнее или нет | Одна команда не называется пати |
| Капитан / пати-лидер | Собрать связки под текущий patch bucket | Мета другого bracket не подставляется молча |
| Зритель про-сцены | Найти игрока и матч | Про-имя из одного источника не затирает другое без пометки |
| Аналитик | Фильтры и сырые ряды | Оценки не смешиваются с фактами матча |

Аудитория — игроки с публичной или частично публичной историей. Приватный профиль получает честный пустой или урезанный паспорт, а не нули, похожие на статистику.

---

# 4. User Problems

1. Статистика есть, но lifetime смешан с текущим патчем.
2. 70% на 10 играх выглядит сильнее 53% на сотнях тысяч.
3. Два игрока «часто вместе» в peers, но это враги, старые матчи или турнирное лобби, не пати.
4. MMR и ранг на сайтах противоречат друг другу.
5. Мета без позиции и bracket бесполезна для конкретного игрока.
6. После буквенного патча сайты ещё долго показывают прошлый срез или один bucket на всю ветку.
7. Match history у части сервисов закрыта логином, хотя матч публичный.
8. Чужие performance score нельзя воспроизвести и нельзя объяснить.

---

# 5. Competitive Research

| | Dotabuff | OpenDota | STRATZ | Наш продукт |
|---|---|---|---|---|
| Роль | Полированная энциклопедия | Сырой верстак и API | Глубокая аналитика поверх реплея | Паспорт + Duo + честная мета |
| Вход | Steam, часть страниц только после входа | Чтение без входа, Refresh/API key для объёма | Чтение без входа; private требует логин владельца | Чтение публичного без входа; Steam только чтобы связать свой профиль |
| Мета | Win/pick/ban, facets, rank, patch | `/heroStats`, scenarios; поля бакетов UNVERIFIED | Win/pick, position, тренд внутри окна; ban на проверенном экране не виден | Win/pick/ban если поле есть; иначе ban скрыт. Robust sort |
| Позиция | 5 иконок + lane на игроке из analyzed matches | `lane_role` 1–4 + roaming | Safe/Mid/Off/Soft/Hard и фильтр positions | MVP: lane role как lane role. Pos 1–5 только из подтверждённого источника |
| Duo | Нет отдельного продукта | Peers + included account id | Peers; Solo/Party фильтр на игроке | Отдельный модуль |
| Score | Hero Score | Benchmarks percentiles | Знаковый модификатор на матче | Свой Role Impact только в P1, с формулой |
| Свежесть | Минуты на просмотренных страницах | Зависит от parse queue и refresh | На meta-экране срез 11–18 сентября при визите 29 сентября | Timestamp на каждом блоке |
| Патч | Patch 7.41 одним значением | id 60 = 7.41 с 24.03.2026 | Окно дат, не буква 7.41f | Два календаря: official letter и analytics bucket |

Парность функций — по **категориям** аналитики, не по текстам, вёрстке и чужим метрикам.

---

# 6. Feature Parity Matrix

Приоритет: P0 без этого продукт не отвечает на три вопроса; P1 усиливает; P2 можно отложить. «Нужна» = входит в модель, не обязательно в P0.

| Сервис | Функция | Что делает | Ценность | Источник | Нужна | Приоритет |
|---|---|---|---|---|---|---|
| Dotabuff | Hero meta table | Win/pick/ban, change, tier, facet group | Снимок меты | Агрегат публичных матчей. У нас OpenDota `/heroStats` + свой расчёт; ban UNVERIFIED | Да | P0 без ban, P1 ban |
| Dotabuff | Rank × position × mode × date | Комбинируемый срез | Сравнимая мета | OpenDota public match `avg_rank_tier` + lane; полный срез дорог | Да | P0 грубый bracket, P1 position |
| Dotabuff | Hero page lanes, items, counters | Как героя играют | Страница героя | `/heroes/{id}/matchups`, itemPopularity, scenarios | Да | P1 |
| Dotabuff | Player mastery / records / achievements | Редкие достижения | Мотивация, легко токсично | Свои пороги по sample | Частично | P2 |
| Dotabuff | Esports / clips / forums / Plus | Медиа и подписка | Не ядро аналитики | Не наш источник | Нет в MVP | P2 / вне scope |
| OpenDota | Player overview + averages/max | Форма и потолок | «Как я играю» | `/players`, `/wl`, recentMatches, totals | Да | P0 |
| OpenDota | Match filters | Дата, патч, герой, сторона, союзник, враг | История | `/players/{id}/matches` query | Да | P0 основные, P1 allied/enemy hero |
| OpenDota | Peers with/against | Вместе и против | Заготовка Duo и H2H | `/peers` | Да | P0 |
| OpenDota | Included account matches | Список общих матчей и герои | Duo hero pairs | VERIFIED query | Да | P0 |
| OpenDota | Histograms, counts, wardmap, wordcloud | Распределения и карта | Глубина | Соответствующие player endpoints, DOCUMENTED | Wardmap да, wordcloud нет как ядро | P1 / P2 |
| OpenDota | Rankings, benchmarks | Процентиль на герое | Player vs field | `/rankings`, `/benchmarks` | Да, с подписью «глобальный, не bracket» пока bracket UNVERIFIED | P1 |
| OpenDota | Explorer / SQL | Произвольные запросы | Опасно как UX | `/explorer` | Нет в продукте | Не делаем |
| OpenDota | Request parse | Дозаказ разбора реплея | Полнота матча | `/request`, DOCUMENTED | Да, квота | P1 |
| STRATZ | Position labels | 1–5 / lane names | Роли | STRATZ UI; API field UNVERIFIED | Да | P1 после схемы |
| STRATZ | Meta trend inside window | Start, current, delta | Динамика | STRATZ UI; свой расчёт по дням в P1 | Да | P1 |
| STRATZ | Solo/Party filter | Отделяет пати | Честность Duo | STRATZ UI; у нас `party_id` только в parsed match | Да | P0 флаг unknown, P1 party |
| STRATZ | Guides, guilds, STRATZ+ draft assistant | Гайды и live draft | Дорого и чужой продукт | Не копировать ассистент | Guides P2, guilds вне scope | P2 |
| STRATZ | Match +/- score | Оценка игры | Понятный матч | Не использовать чужое имя | Свой Role Impact | P1 |
| Все | Steam login | Связать профиль | Идентичность | OpenID | Да | P0 |
| Все | Leaderboards | Топы | Легко врут на малой выборке | OpenDota rankings / свой порог | Осторожно | P1 |

---

# 7. Data Source & API Matrix

| Данные | Valve/Steam | OpenDota | STRATZ | Другой | Основной | Fallback | Примечание |
|---|---|---|---|---|---|---|---|
| Player identity | OpenID SteamID64, GetPlayerSummaries, ResolveVanityURL | `profile` внутри `/players/{id}` | UI имя/команда может расходиться | — | Steam для входа; OpenDota profile для публичной карточки | Steam summaries, если OpenDota пуст | Не склеивать pro name молча |
| account_id | Вычитается из SteamID64 | Поле API | URL `/players/{id}` | — | Канонический 32-bit account id | — | SteamID64 в Dota API не передавать |
| Matches list | GetMatchHistory, max 100, скрытая история падает | recentMatches, matches | UI, private режет до league | — | OpenDota | Valve history только как проверка «история скрыта» | Кэшировать |
| Match detail | GetMatchDetails, OpenDota считает его сломанным | `/matches/{id}` | UI playback | — | OpenDota parsed | Карточка без timeline, если не parsed | `version == null` → unparsed |
| Heroes catalog | — | `/heroes`, `/constants/heroes` | UI | dotaconstants | OpenDota + локальный кэш constants | — | Ростер не хардкодить |
| Hero stats | — | `/heroStats` VERIFIED 200, поля UNVERIFIED | Meta UI | — | OpenDota, после фиксации полей | Скрыть срез, если поля не те | Не выдумывать `1_pick` |
| Ranks | Нет публичного MMR в исследованных API | `rank_tier`, `leaderboard_rank` | Региональный leaderboard на странице | — | OpenDota rank_tier | STRATZ rank отдельным badge | Не усреднять 379 и 321 |
| MMR | Не подтверждён | `computed_mmr` оценка | Не извлечён | — | Не показывать как MMR | — | Только подпись Estimate, P1, либо скрыть |
| Lanes | — | `lane`, `lane_role`, `is_roaming` | Lane labels на героях | — | OpenDota lane_role | — | Подпись «lane role, не позиция» |
| Roles / pos 1–5 | — | Нет отдельного поля в recentMatches | UI positions | — | Нет в P0 как факт | STRATZ после валидации схемы | Эвристика по GPM запрещена как «истина» |
| Items | GetMatchDetails items, UNVERIFIED полнота | parsed `item_0..5`, purchase_log | UI builds | — | OpenDota parsed | Конечные слоты без таймингов | item win rate = association |
| Abilities / talents | — | `ability_upgrades_arr` schema | UI guides | — | OpenDota parsed | Скрыть блок | |
| Facets | — | `hero_variant` есть, семантика 0 UNVERIFIED | Grouping у Dotabuff; STRATZ field UNVERIFIED | — | Не строить facet meta в P0 | P1 после словаря variant→facet | `/constants/facets` = 404 |
| Teammates | — | peers `with_*`, included_account_id | Peers UI | — | OpenDota | — | |
| Opponents | — | peers `against_*` | — | — | OpenDota | — | Отдельный H2H, не synergy |
| Draft | picks_bans в schema matches | parsed/pro match | UI | — | OpenDota, если поле есть в матче | «Draft unavailable» | Public ranked часто без полного draft order — UNVERIFIED для каждого матча |
| Game mode | — | `game_mode`, constants | фильтр UI | — | OpenDota constants | — | 22 All Draft, 23 Turbo VERIFIED |
| Region | — | `cluster` / region filter DOCUMENTED | фильтр UI | — | OpenDota cluster + constants region | Имя региона UNVERIFIED, пока constants resource не проверен | |
| Wards | — | obs/sen schema, wardmap endpoint DOCUMENTED | UI | — | OpenDota parsed | Скрыть | |
| Party | — | `party_size` в recentMatches; `party_id` в schema | Solo/Party фильтр | — | parsed `party_id` | `party_size` только как слабый сигнал | party_size 10 ≠ «пати из 10 друзей» |
| Patch analytics | Новости 7.41f | constants id 60 = 7.41 | окно дат | Liquipedia как сверка даты, не как API | OpenDota patch id + официальная буква отдельно | — | Не смешивать |
| Hero matchup | — | `/heroes/{id}/matchups` DOCUMENTED; исторически pro-only — UNVERIFIED сейчас | UI counters | — | Не обещать pub matchup, пока выборка не подписана | — | Проверить population при реализации |
| Hero synergy | — | Нет отдельного подтверждённого pub synergy endpoint | UI | — | Считать самим из матчей только для Duo пар игрока | Глобальный synergy героев P1 | |
| Performance score | — | benchmarks | чужой +/- | — | Не импортировать | Свой Role Impact P1 | |
| Search | ResolveVanityURL, SteamID | `/search` DOCUMENTED, вызов в сессии таймаутился | UI search | — | Steam vanity + OpenDota search | — | Таймаут = UNVERIFIED стабильность |

---

# 8. Steam Identity & Authentication Strategy

## Основной вход

Sign in with Steam через OpenID 2.0.

1. Браузер уходит на Steam OP `https://steamcommunity.com/openid/`.
2. Пользователь логинится на Steam. Пароль в наш сервис не попадает.
3. Возврат на наш `return_to`.
4. Сервер подменяет `openid.mode` на `check_authentication` и проверяет подпись у Steam. Успех одноразовый.
5. Из Claimed ID берётся SteamID64.
6. `account_id = SteamID64 - 76561197960265728`.
7. Создаётся или находится User, связанный со SteamIdentity. Сессия — наша, не Steam-токен веб-API.

OpenID даёт SteamID, не аватар и не матчи. Аватар и ник — `GetPlayerSummaries` серверным ключом или уже сохранённый OpenDota profile.

## Поиск без входа

| Ввод | Надёжность | Действие |
|---|---|---|
| SteamID64, 17 цифр, обычно с 7656119 | Высокая, арифметика проверена на живой паре | Конверт в account_id |
| account id / OpenDota-стиль URL | Высокая | Прямой lookup |
| `steamcommunity.com/profiles/{steamid64}` | Высокая | Разобрать SteamID64 |
| `steamcommunity.com/id/{vanity}` | Высокая, если ResolveVanityURL успешен | Steam Web API |
| Ник | Низкая, коллизии | `GET /search` как список кандидатов, не автовыбор |
| Friend Code / `s.team/p/...` | Нет официального API | Optional. Если декодер не прошёл внутренний тест на известных парах — не принимать. Не обещать в P0 |

Пользователь никогда не вводит пароль Steam у нас.

## Привязка

Один User может связать один SteamIdentity в MVP. Unlink удаляет связь и наши производные агрегаты этого пользователя, но не публичные матчи, которые остаются как публичные факты Dota (они не «принадлежат» аккаунту сервиса). Повторный вход с тем же SteamID восстанавливает связь, если пользователь не просил deletion.

---

# 9. Product Information Architecture

## Global

- Home — три входа: игрок, мета, Duo.
- Players — поиск и недавние открытые профили на этом устройстве, без «токсичного топа».
- Heroes — каталог.
- Matches — переход по match id, не лента всех матчей мира.
- Meta — срезы героев.
- Duo — два игрока.
- Leaderboards — P1, с порогом выборки.
- Search.
- Login / мой паспорт.

Esports, форумы, клипы, гильдии, букмекерство — вне продукта.

## Player

Overview, Matches, Heroes, Roles, Trends (P1), Teammates, Opponents, Matchups (P1), Builds (P1), Activity (P1). Achievements — P2.

## Hero

Overview, Meta, Positions (когда источник есть), Matchups, Builds, Items, Abilities, Facets (P1), Patch history (P1).

## Duo

Overview, Shared matches, Hero pairs, Roles, Lanes, Trends, Head-to-head, Notes (что можно сказать при текущей выборке).

## Три слоя на каждом экране

| Экран | Instant | Explore | Deep |
|---|---|---|---|
| Player | Ник, ранг-медаль, WR и запись **подписанного** среза, 3 героя с порогом, форма last 20 | Герои, роли, матчи | Фильтры, сырые ряды, source |
| Hero | WR/pick/n в текущем срезе, robust rank | Позиции, предметы, матчапы | История патчей, перцентили |
| Match | Счёт, герои, результат фокус-игрока | Скорборд | Timeline, если parsed |
| Duo | Игры вместе, WR вместе, дельта к expected, confidence | Пары героев, роли | Список матчей, party flag |

Mobile: карточки вместо широких таблиц; фильтры под disclosure; первая колонка героя/игрока залипает. Декоративные radar не используем.

---

# 10. Player Profile Specification

## 10.1 Identity Header

**Purpose:** узнать, чей это паспорт и насколько он полон.  
**Input:** account_id.  
**Source:** OpenDota `/players/{id}` + Steam summaries при наличии ключа.  
**Calculation:** нет, кроме конверта id.  
**UI:** аватар, persona name, ссылка на Steam, account id (полезно и публично — это не секрет), last match time, rank medal из `rank_tier`, leaderboard rank если есть, matches/wins/losses/WR выбранного среза. `computed_mmr` в P0 не показывать. В P1 — только «OpenDota estimate», никогда рядом с медалью как подтверждение.  
**Filters:** срез шапки по умолчанию — significant matches, подпись «без Turbo и незначимых, пока не включены».  
**Edge cases:** `fh_unavailable`, пустой profile, ник из aliases не подменяет текущий persona в шапке. Стена старых ников скрыта: это чувствительная история, не фича.  
**Sample:** шапка не требует минимума; при 0 матчей — empty state.  
**Priority:** P0.  
**Acceptance:** см. конец секции.

`rank_tier` 80 на живом примере означал Immortal (десятки — медаль, единицы — звёзды; 80 — особый случай Immortal). Точную таблицу медалей брать из текущего UI-словаря OpenDota при реализации и не хардкодить навсегда. Если код неизвестен — показать число и подпись «unmapped rank code».

## 10.2 Overall Performance

**Purpose:** объём и средние боевые числа.  
**Source:** `/wl` для W/L выбранного фильтра; средние из `/totals` (DOCUMENTED) или агрегата matches. Не смешивать `/wl` без фильтра с суммой всех recentMatches.  
**UI:** matches, W/L, WR, KDA, avg K/D/A, GPM, XPM, last hits, denies если поле есть, hero damage, tower damage, healing, duration. Teamfight participation — только если поле пришло из parsed-агрегата, иначе скрыть.  
**Calculation:** WR = wins / (wins+losses). KDA = (K+A)/max(D,1) и подпись формулы.  
**Edge:** denies нет в recentMatches. Не рисовать 0.  
**Sample:** средние показывать с n.  
**Priority:** P0 для K/D/A/GPM/XPM/LH; healing и tower — P0 если поле в том же ответе, иначе P1.

Comeback / stomp / close game в P0 нет: пороги gold swing не подтверждены отдельным полем. P1: close game = длительность и разница нетворса на 10-й минуте только для parsed (`radiant_gold_adv` в schema). Это описательная метка, не причина победы.

## 10.3 Recent Form

Отдельный блок от lifetime.

| Срез | Как получить | Статус |
|---|---|---|
| Last 10/20 | recentMatches или matches limit | VERIFIED recent = 20 |
| Last 50/100 | matches `limit` | DOCUMENTED |
| Last 30 days | `date=30` | DOCUMENTED, UI Date есть |
| Current patch bucket | `patch=60` сегодня | id VERIFIED, имя параметра DOCUMENTED |

Показывать WR, KDA, avg duration, распределение lane role, топ героев. Подпись периода обязательна. Lifetime и patch 60 не рисуются одной цифрой.

Тренд: сравнение last 20 с предыдущими 20 по WR. Если n < 20, тренд не называть «формой», показывать «мало игр».

## 10.4 Heroes

**Source:** `/players/{id}/heroes` DOCUMENTED. Поля игр/побед ожидаются этим endpoint; точный JSON **UNVERIFIED до первого вызова на реализации**. До вызова не обещать KDA на герое из этого endpoint: KDA может потребовать агрегации matches.

На героя: games, wins, losses, WR, lane role мода, last played, recent WR, patch WR, sample warning.

Сортировки: most played; highest/lowest WR только при n ≥ порога; recent form; current patch. «Highest impact» и «most improved» — P1, потому что impact ещё не определён, а improved требует двух окон.

**Порог «лучший герой»:** не показывать бейдж при n < 20. При 20–49 бейдж «ранний сигнал». Стабильный бейдж при n ≥ 50 и Wilson lower bound выше среза игрока. Одна–три игры остаются в таблице с меткой low sample и не попадают в шапку.

Percentile среди других игроков — `/rankings` DOCUMENTED, P1, с подписью популяции (глобальная, не Divine-only, пока иное не доказано).

## 10.5 Roles

В P0 не писать «Position 5». Писать lane role по словарю OpenDota: 1 Safe, 2 Mid, 3 Off, 4 Jungle, плюс roaming если `is_roaming`. Доля, W/L, WR, пул героев. Смена роли по патчам — P1.

Jungle показывать, только если в данных есть lane_role 4. Не удалять исторические игры из-за того, что роль устарела.

Position 1–5 — P1, источник STRATZ после валидации, badge «STRATZ position». Если STRATZ недоступен, блок позиций скрыт, lane role остаётся.

Core vs Support в P0 не выводить из фантазии «support = lane 4». Dotabuff считает это по analyzed matches своей моделью. Наша подпись Core/Support появится только вместе с документированной моделью (P1): например доля игр в lane role 1–3 против roaming/support-ассоциированных героев — и тогда это **оценка**, не факт.

## 10.6 Game modes

Группы по constants, не по хардкоду навсегда:

- Ranked All Pick: lobby ranked (7) и game_mode all draft (22) — пара VERIFIED на живых матчах. Точное имя lobby 7 сверять с `/constants/lobby_type` на реализации (ресурс DOCUMENTED, в сессии не скачивался).
- Turbo: game_mode 23.
- Unranked / normal: прочие balanced modes с lobby не ranked.
- Captains / event: показывать внутри «другие», если есть игры.
- Ability Draft, 1v1, event: не в дефолтном значимом срезе, данные не удалять.

На группу: games, W/L, WR, avg duration. Нерелевантные свёрнуты.

## 10.7 Playstyle Profile

P1. Только наблюдаемые доли за выбранный период, n ≥ 30:

- доля lane role;
- hero concentration: доля топ-3 героев;
- avg duration против медианы своего среза;
- GPM против benchmarks героя, если benchmarks доступны.

Имена состояний: «чаще safe lane», «узкий пул», «длинные игры». Запрещены: «агрессивный человек», «токсичный», «умный». Conduct STRATZ не копируем: это чужая и морально опасная метка.

### Player Overview — Acceptance Criteria

- Игрок находится по SteamID64, profile URL, vanity URL и account id.
- Friend Code не требуется и не ломает поиск.
- Lifetime и last 20 / patch показаны разными числами с подписями.
- Low sample на герое виден и не становится бейджем «лучший».
- Patch bucket подписан («7.41, не буква 7.41f»).
- `computed_mmr` не показан как MMR.
- Ошибка API — состояние ошибки, не пустой профиль с нулями.
- У блока есть время обновления.
- При `fh_unavailable` или private-урезании текст объясняет, чего нет.
- Lane role не назван Position 1–5.

---

# 11. Match History Specification

**Purpose:** найти конкретные игры и отфильтровать их.  
**Source:** `GET /players/{id}/matches` с query. Recent — `recentMatches`, если фильтров нет и нужны последние 20 быстро.  
**UI:** таблица на широком экране, карточка на узком. Колонки, которые VERIFIED в recent: дата, match id, герой, результат (слот + `radiant_win`), длительность, mode, lobby, lane role, K/D/A, GPM, XPM, last hits, healing, tower damage, party_size, hero_variant. Denies и предметы — если `project` или match detail их отдаёт; до проверки `project` не обещать в строке списка.  
**Filters P0:** date, patch, mode, lobby, hero, lane role, win/loss, side.  
**Filters P1:** region, teammate (`included_account_id`), opponent, with/against hero, duration, significant, party size.  
**Sort / pagination:** `limit` + `offset` DOCUMENTED. Дефолт 20–50. Не грузить всю историю в браузер.  
**Search:** match id в глобальном поиске.  
**Edge:** anonymous teammates; leaver; version null — бейдж «без разбора реплея»; огромная история — курсор по offset, кэш первой страницы.  
**Sample:** список не скрывает low-sample матчи.  
**Priority:** P0.  
**Acceptance:** фильтр патча меняет строки; Turbo не смешан с ranked без подписи; пагинация не теряет матч на границе; ошибка 429 показывает «лимит источника, данные могут быть вчерашними из кэша».

Dotabuff требует логин, чтобы смотреть чужие матчи. Мы этого не копируем: публичный матч читается без входа. Логин нужен, чтобы привязать свой паспорт и инициировать refresh своего id.

---

# 12. Match Detail Specification

**Purpose:** один матч как проверяемый отчёт.  
**Source:** `GET /matches/{match_id}` DOCUMENTED. Полнота зависит от parse.  
**UI header:** результат, стороны, длительность, mode, lobby, patch bucket по `start_time` относительно таблицы patch, дата, match id, region/cluster, avg rank если есть. Party: «неизвестно», пока у игроков нет `party_id`.

**Draft:** picks/bans если массив есть. Иначе блок скрыт, не пустая сетка. Порядок пика — только если есть `ord` / draft_timings.

**Scoreboard, 10 игроков:** герой, K/D/A, GPM, XPM, LH, denies если есть, net worth если есть, hero damage, tower, healing, предметы конечного слота. Abilities и talents — parsed only. Teamfight — если массив `teamfights` есть.

**Timeline P1:** gold/xp advantage arrays, purchase_log, kills_log, objectives. Минутные ряды есть в schema (`gold_t`, `xp_t`, `lh_t`) у parsed. Не рисовать график из одной точки.

**Player focus:** выбор одного слота подсвечивает его предметы, способности и тайминги. Текст «контекст» — шаблон из чисел («предмет X куплен на минуте T»), не рассказ о намерениях.

**Свой score в P0 отсутствует.** В P1 имя **Role Impact**, шкала 0–100, составные части видны. Не называть его IMP, Hero Score или любым чужим брендом. Не строить только из KDA.

**Edge:** неparsed; леавер; меньше 10 известных account id; спецрежим.  
**Priority:** header + scoreboard P0; timeline и Role Impact P1.  
**Acceptance:** неparsed матч открывается и прямо говорит, каких блоков нет; победа стороны совпадает с `radiant_win` и слотом; match id в URL шарится.

---

# 13. Hero Meta Specification

**Purpose:** «что происходит в Dota» внутри подписанного среза.  
**Source of truth:** свой агрегат, посчитанный из OpenDota и закэшированный. Первичный фид — `/heroStats`, после того как реализация зафиксирует реальные ключи. До этого экран не выдумывает колонки. Если в `/heroStats` нет бана — колонки бана нет. Если нет разбивки по позиции — нет Position Meta.

**Views:** All, Popular (по pick, n не ниже порога), Winning (по Wilson lower bound, не по сырому WR), Snapshot текущего patch bucket. Trends, Position Meta, Facet Meta — P1.

**Колонки:** герой, observed WR, pick rate, games, Wilson lower bound, окно, patch bucket. Change vs предыдущее окно — P1. Ban — только при подтверждённом поле.

**Фильтры P0:** patch bucket или date range (одно активное окно), game mode group (ranked AP / turbo).  
**Фильтры P1:** rank bracket, lane/position, facet. Комбинация «patch + ranked + Immortal + mid» — цель P1, не обещание P0, потому что дешёвого готового среза в проверенных endpoint'ах нет. Считать его обходом всех public matches на каждый просмотр нельзя.

**UI:** таблица + sparkline только когда есть ≥ 2 точки. Tier S/A/B не вводим: это ложная точность. Вместо tier — robust rank и n.

**Freshness:** время пересчёта агрегата. Если агрегат старше 48 часов внутри активного патча — предупреждение. Официальная буква патча показывается отдельно: «Сейчас в игре 7.41f от 15.09.2026. Статистика ниже — весь bucket 7.41 с 24.03.2026, буквы не разделены».

**Acceptance:** герой с 70% на 10 играх не выше героя с устойчивым WR на большой выборке в сортировке Winning; n видно; смена фильтра меняет подпись среза; пустой срез не заполняется глобальными числами.

---

# 14. Hero Page Specification

**Purpose:** один герой в текущем срезе и относительно игрока, если игрок выбран.  
**Blocks P0:** имя, атрибут, роли из `/heroes`; observed WR, pick, n; ссылка в мету.  
**Blocks P1:** тренд, позиции, facets, items по фазам (`itemPopularity` — pro games по тексту документации; подпись «pro sample», не pub), ability builds, talents, matchups, durations, rank brackets, top players `/heroes/{id}/players`.  
**Counters:** games, wins, WR, n. Дифференциал к WR героя. Не писать «контрит», если n ниже порога: писать «реже выигрывает в этой выборке».  
**Edge:** новый герой с нулём игр — страница есть, статистики нет.  
**Acceptance:** population выборки подписана (pro / public / unknown); предметы не рекомендованы как причина победы.

---

# 15. Player vs Meta Specification

**Purpose:** «на этом герое ты на X п.п. выше или ниже меты сопоставимой выборки».  
**Input:** player+hero+patch+mode+bracket+lane.  
**Source:** WR игрока из его матчей в срезе; WR героя из мета-агрегата **того же** среза.  
**Calculation:** `delta_pp = player_wr - meta_wr`, в процентных пунктах. Рядом n игрока и n меты.  
**UI:** фраза из промпта допустима только если срезы совпали. Иначе: «сравнение с глобальной метой, bracket не совпадает».  
**Sample:** n игрока < 20 → delta серым, без утверждения «выше меты». Доверительный интервал WR игрока (Wilson) должен не пересекать meta WR, чтобы фраза была утверждением; иначе «неотличимо от меты при этой выборке».  
**Percentile:** P1, только если rankings/benchmarks описывают ту же популяцию.  
**Priority:** P1 для полного среза; P0 можно показать delta к **глобальному** patch WR с жёсткой подписью «не ваш bracket».  
**Acceptance:** Divine игрок не сравнивается молча с Herald-смешанной метой; формула видна в advanced; нет ложной точности вида 3.1415 п.п.

---

# 16. Player Comparison Specification

**Purpose:** «какие у них показатели», не «как они вместе».  
**UI:** две колонки. Matches, WR lifetime, WR last 20, WR current patch, топ герои, lane role mix, modes, KDA, GPM, XPM, rank medal, размер пула (уникальные герои / игры). Пересечение героев и уникальные герои.  
**Source:** те же player endpoints, по одному на игрока, затем кэш.  
**Calculation:** разница показывается как разница двух наблюдаемых чисел, без прогноза «кто победит».  
**Edge:** разный объём истории; один private. Пустые клетки, не нули.  
**Priority:** P0 базовые колонки; rank history chart P1.  
**Acceptance:** на экране написано Comparison, нет synergy score; ссылка «открыть Duo» ведёт в другой модуль.

---

# 17. Duo / Synergy Specification

Рабочее имя раздела: **Duo**. Synergy — оценка внутри него, не синоним «они были в одном матче».

## 17.1 История экрана

1. Ваши цифры — n, W/L, WR вместе, два личных WR, freshness.  
2. Как вы играете вместе — same team vs против, party unknown/yes.  
3. На чём сильнее — пары героев с порогом.  
4. Какие роли — lane role пары, не «химия».  
5. Что работает на этом patch bucket.  
6. Что изменилось — last 20 общих vs предыдущие, если n позволяет.  
7. Против кого — только при достаточном n, P1.  
8. Совместный профиль — доли ролей и пулов, без психологии.

## 17.2 Данные

| Факт | Источник | Доказательство |
|---|---|---|
| Играли в одних матчах | peers и/или included_account_id | VERIFIED |
| Одна команда | слоты обоих < 128 или оба ≥ 128 | VERIFIED на heroes map |
| Против друг друга | слоты по разные стороны; peers `against_*` | VERIFIED |
| Пара героев | heroes map | VERIFIED |
| Party | одинаковый `party_id` в parsed player | schema VERIFIED, в list-ответе поля не было |
| Lane | lane_role каждого в parsed или в matches, если поле отдаётся | recentMatches имеет lane_role для одного игрока; для второго нужен второй запрос или match detail |
| Режим, патч, длительность | матч | VERIFIED в list |

**Запрещено:** называть пару пати, если совпала только команда. `party_size` без `party_id` — «размер группы по данным матча, состав не подтверждён».

**Pipeline:**  

1. Быстрый слой: `/peers` → with_games, with_win, against_games. Подпись: «сводка без фильтра патча».  
2. Точный слой: страницы `matches?included_account_id=&limit=&offset=` пока не кончится окно (patch / date). Классифицировать same team / opponent.  
3. Детали party и второй lane role — только для матчей, которые уже в кэше parsed, либо лениво для первых N. Не скачивать 500 матчей синхронно на открытии страницы.

Стоимость: 1 peers + страницы списка. Детали матчей берутся из общего кэша матчей, потому что матч неизменяем после parse.

## 17.3 Overview numbers

Games together (same team), wins, losses, WR, avg duration, оба lifetime WR, оба last-20 WR, оба patch WR, n в выбранном окне. Against-числа стоят в H2H, не здесь.

Не выводить «52% и 54%, значит вместе 56%».

## 17.4 Synergy model

### MVP — прозрачная модель

Обозначения:

- `pA`, `pB` — WR игроков в **том же** lobby group, mode group и patch bucket, по их одиночным матчам, не по общим.
- `p_obs` — WR их same-team матчей в том же окне.
- `n` — число этих same-team матчей.

Ожидание, независимость на логит-шкале (не среднее арифметическое):

`logit(p) = ln(p / (1-p))`  
`logit(p_exp) = logit(pA) + logit(pB) - logit(0.5)`  
`p_exp = 1 / (1 + exp(-logit(p_exp)))`

Если оба 50%, ожидание 50%. Если оба выше 50%, ожидание выше каждого, но это модель независимости, не закон. Рядом показывать простое среднее `(pA+pB)/2` как справочное, не как score.

`delta = p_obs - p_exp`

Утверждение «вместе лучше ожидания» разрешено только если интервал Уилсона для `p_obs` целиком выше `p_exp`. Иначе статус **inconclusive**.

Сжатие для шкалы 0–100, чтобы малый n не давал 100:

`weight = n / (n + 30)`  
`delta_shrunk = weight * delta`  
`score = clamp(50 + 100 * delta_shrunk, 0, 100)`

30 — приоритет априора, совпадает с порогом «можно говорить». Score без n и без статуса interval на экран не выходит. Score не равен `p_obs * 100` и не равен среднему WR.

### Поздняя модель (P2)

Матчинг внутри bracket, отдельный baseline на lane-pair, байесовская модель с частичным пулингом пар героев. Не в MVP: bracket на каждом матче часто `average_rank: null` (так было в живой выборке ranked-игр).

## 17.5 Hero pairs

Таблица: герой A, герой B, games, wins, WR, Wilson LB, статус low/ok.

Бейджи при n ≥ 15: most played; best by Wilson LB; worst by Wilson LB если n ≥ 15; current patch. «100% на 2 матчах» остаётся в таблице с меткой и не попадает в бейдж. «Самая стабильная» — P1: уже интервал, не отдельная магия.

## 17.6 Role synergy

Пары lane role. Колонки: matches, WR, число уникальных пар героев, avg duration. Фраза «лучше всего Carry+Support» запрещена, пока нет Position 1–5. В P0: «safe lane + mid», и только при n ≥ 15. Вывод о химии линии из общего WR матча запрещён: победа матча не равна победе линии. Отдельной статистики lane outcome в проверенных полях нет → блок «lane won» не существует.

## 17.7 Head-to-head

Отдельный сценарий. Against games, победы A, победы B, пары героев, recent, patch. Это не synergy. При against n < 5 — список матчей без вердикта.

## 17.8 Timeline

Месяц и patch bucket: WR, разнообразие пар (unique pairs / games), avg duration. Last 10/20/50 общих — если столько есть.

## 17.9 What works — карточки

Каждая карточка: утверждение, n, окно, срез, confidence (inconclusive / weak / supported). Примеры, которые можно выпустить:

- «Чаще всего одна команда на паре героев X+Y: n, WR».
- «На patch bucket 7.41 same-team n и WR, интервал пересекает ожидание» — даже негативный вывод полезен.
- «Пул A узкий, пул B другой» — доли, не совет «возьми этого героя», пока n мало.

Карточка «герой, которым один включает другого» — P1 и только как ассоциация: «когда A на герое X, WR пары выше его baseline на этом срезе», n ≥ 20.

## 17.10 Acceptance

- Same team и against не смешаны.
- Слово «пати» появляется только при совпавшем `party_id`.
- Score объясняется и имеет n.
- Малый n не даёт бейдж лучшей пары.
- Ссылка Duo и ссылка Comparison разные.
- Окно патча подписано.
- Если список матчей не догрузился, обзор из peers помечен «грубая сводка, точный список не собран».

---

# 18. Statistical Methodology

## Пороги

| Решение | Минимум n | Иначе |
|---|---:|---|
| Показать сырой WR | 1 | показать n, без ярлыка |
| Бейдж героя игрока | 20 ранний, 50 устойчивый | нет бейджа |
| Утверждение player vs meta | 20 и интервал не пересекает мету | «неотличимо» или скрытый delta |
| Пара героев Duo | 15 для бейджа | строка с low sample |
| Пара ролей Duo | 15 | без фразы «лучше всего» |
| Synergy score как вывод | 30 для «supported» | score серый, статус inconclusive |
| Мета Winning sort | сортировка по Wilson LB; визуальный шум при n < 200 для глобальной меты | не скрывать строку, не давать первое место за счёт n=10 |
| Leaderboard | n ≥ 50 и порог игр на героя | не публиковать |

Пороги — продуктовые константы с версией, не магические истины. Их можно поменять, старые экраны не переписывают историю задним числом без пометки.

## Wilson interval

Для наблюдённой доли `p = wins / n` нижняя граница интервала Уилсона (95%) — рабочая «устойчивая» оценка. Она тянет вниз малые выборки. Сортировка Winning и best pair идёт по нижней границе. На экране: observed WR, n, lower bound. Не показывать bound как «истинный винрейт».

Формула (z = 1.96):

`center = (p + z²/2n) / (1 + z²/n)`  
`margin = z * sqrt(p(1-p)/n + z²/4n²) / (1 + z²/n)`  
`lower = center - margin`

## Чего нет в MVP

Полный байесовский shrinkage к мете роли — P1 для player WR: тянуть `p` к WR героя в том же срезе с силой априора `k = 20`:

`(wins + k * meta_wr) / (n + k)`

Это сглаженная оценка, подпись «shrunk», не замена observed.

## Сегментация

Любое сравнение фиксирует: patch bucket, mode group, и при наличии bracket и lane. Несколько срезов сразу (герой × роль × патч × бракет) плодят ложные «находки». Карточки What works ограничены: не больше 6 на экран, приоритет у наибольшего n. Это практическое ограничение множественных сравнений, не статистическое доказательство.

## Полнота

Parsed и unparsed не усредняются в одной метрике таймингов. Significant и turbo не усредняются в шапке. Если у 40% матчей нет lane_role, доля ролей считается от известных, и UI пишет «роль известна в X из Y».

## Корреляция

| Тип | Пример | Можно сказать | Нельзя сказать |
|---|---|---|---|
| Observed association | Предмет X чаще в победах | «В победах этот предмет встречается чаще» | «Предмет поднял шанс победы» |
| Descriptive | WR, n, KDA | Цифры среза | Прогноз следующего матча |
| Modeled estimate | p_exp, Wilson, shrunk | «Оценка при модели …» | «Истинный скилл» |
| Recommendation | Герой близок к пулу и мете | «Имеет смысл смотреть» + основания | «Ты выиграешь, если возьмёшь» |

---

# 19. Personalized Meta

Имя экрана: **Your Meta**.

Пересечение, все оси подписаны:

`сила игрока (n и WR на герое) × мета среза × lane role × patch bucket × mode`

P0-упрощение, если bracket и position ещё ненадёжны: ось «герои, на которых у игрока n ≥ 20 в текущем patch bucket» против «герои с высоким Wilson LB в глобальной ranked-мете этого bucket». Четыре квадранта:

| | Мета устойчиво высокая | Мета не высокая |
|---|---|---|
| Игрок устойчиво не ниже своей базы | Играть знакомое в сильной мете | Сигнатура игрока вне мета-топа |
| Игрок ниже своей базы или n мал | Мета есть, личного сигнала нет | Не рекомендовать |

Это не рейтинг «имба». Пустой квадрант честнее выдуманного совета.

**Priority:** P1. В P0 на обзоре одна строка: топ-3 героя игрока с n ≥ 20 и их delta к глобальной мете patch bucket, с подписью ограничений.

---

# 20. Recommendations

P1. Правила:

- Кандидат только если знакомство (n ≥ 20 lifetime) **или** явная подпись «мало игр, это мета, не твой герой».
- Учитывать lane role, patch bucket, mode.
- Не рекомендовать по глобальному WR без n.
- Отделять: «хорошо относительно себя», «хорошо относительно меты», «часто играешь и проседаешь».
- Герои «попрактиковать» — высокий robust meta WR в его lane role и малый личный n. Это гипотеза знакомства, не обещание WR.
- Текст карточки ссылается на n, окно и delta.

AI может переформулировать уже посчитанные карточки. AI не выбирает героя, которого нет во входном списке.

---

# 21. Shareability / Community Features

P1, если не сказано иное.

| Артефакт | URL | Примечание |
|---|---|---|
| Player | `/players/{account_id}` | Публичный id и так публичен |
| Hero | `/heroes/{slug}` | |
| Duo | `/duo/{idA}/{idB}` | id по возрастанию, чтобы ссылка была одна |
| Comparison | `/compare/{idA}/{idB}` | другой смысл |
| Карточка | P2 изображение: WR среза, n, patch bucket, не чужие логотипы | |
| Compact text | Копируемый абзац из 4 чисел с окном | P1 |
| Social preview | title и description из тех же чисел | P1 |
| Anonymized | Не обещать: account id восстанавливает личность. Можно скрыть ник в картинке, id в ссылке остаётся. Для настоящего анонима ссылку не делать | |

Лидерборды P1: specialists (n ≥ 100 на герое, сорт по Wilson LB внутри bracket, когда bracket есть). Без bracket — не публиковать «лучший в мире». Региональные и patch boards — когда регион и патч надёжны.

Шаринг не включает стены aliases и conduct.

---

# 22. UX Principles

1. Достоверность выше впечатления.
2. Instant / Explore / Deep на player, hero, match, duo.
3. Важное сверху: вывод, затем таблица, затем сырьё.
4. Фильтры помнят выбранный срез в пределах сессии и пишут его в URL, чтобы ссылка воспроизводилась.
5. Цвет победы не единственный носитель смысла (текст W/L).
6. Low sample — другой визуальный вес, не удаление строки.
7. Пустое состояние объясняет причину: приватность, не спарсено, фильтр слишком узкий, источник недоступен.
8. Mobile-карточки для таблиц шире 6 колонок.
9. Ник и герой — текст, не только цвет и иконка.
10. Чужие бренды метрик не появляются в UI.

Визуализации по работе, не по наличию библиотеки графиков:

| Вопрос | Вид |
|---|---|
| Один показатель среза | KPI |
| Много героев | Таблица |
| Доля ролей | Bar |
| WR по времени | Line, если ≥ 4 точек |
| Пара героев A×B при достаточном n | Matrix, иначе таблица |
| Игрок против меты | Comparison bar delta |
| Матч | Timeline только parsed |
| Radar | Не используем |

---

# 23. Conceptual Data Model

Сущности логические. Это не схема БД и не код.

| Сущность | Назначение | Ключевые поля | Связи | Source of truth | Жизнь | Refresh |
|---|---|---|---|---|---|---|
| User | Аккаунт сервиса | внутренний id, created | 0..1 SteamIdentity | наш сервис | пока не удалён | — |
| SteamIdentity | Связь со Steam | steamid64, account_id | User, Player | OpenID | unlink / delete | при логине summaries |
| Player | Публичный игрок | account_id, persona, avatar, rank_tier, leaderboard_rank, fh_unavailable | матчи | OpenDota profile | обновляемый снимок | кэш 15–60 мин; refresh по запросу владельца |
| Match | Один матч | match_id, start, duration, mode, lobby, radiant_win, patch_id, cluster, parsed_version | 10 MatchPlayer | OpenDota match | иммут после финального parse; reparse возможен | кэш долго; если version null, повтор позже |
| MatchPlayer | Слот | slot, account_id nullable, hero_id, KDA, GPM, XPM, LH, lane_role, party_size, hero_variant, items | Match, Player, Hero | OpenDota | вместе с Match | вместе с Match |
| Hero | Каталог | hero_id, key, localized name, attr | — | OpenDota heroes | меняется с патчем | ежедневно |
| HeroFacet | Словарь варианта | hero_id, variant, name | Hero | UNVERIFIED | — | не создавать, пока нет словаря |
| Item, Ability, Talent | Каталоги | id, name | — | constants | патч | ежедневно |
| Patch | Два ряда | analytics id+name+start; official letter+date | — | OpenDota constants; новости Valve | append-only | при старте и ежедневно |
| GameMode, Lobby | Словари | id, name, balanced flag | — | constants/game_mode VERIFIED | редко | ежедневно |
| LaneRole | Словарь 1–4 + roaming | id, label | — | документация scenarios | редко | статический словарь с версией |
| Role | Pos 1–5 | id | — | STRATZ позже | — | не в P0 |
| PlayerHeroStats | Агрегат | account, hero, patch, mode, n, wins, avgs | Player, Hero | наш расчёт из матчей | пересчёт | по завершении синхронизации игрока |
| PlayerRoleStats | То же для lane role | | | наш расчёт | | |
| PlayerTrend | Окна 10/20/50/100/30d/patch | WR, KDA, n | Player | наш расчёт | | |
| HeroMetaStats | Срез меты | hero, window, mode, n, wins, pick, wilson_lb | Hero | наш расчёт из heroStats | | 6–24 ч |
| HeroMatchup | Герой против героя | n, wins, population tag | | OpenDota matchups, population UNVERIFIED | | P1 ежедневно |
| HeroSynergy | Глобальные пары героев | | | нет дешёвого источника | | не в P0 |
| PlayerPair | Пара account id | ordered ids | | наш | | |
| PlayerPairMatch | Факт общего матча | same_team, party_known | Match | наш из списка | | при открытии Duo |
| HeroPairStats | Агрегат пар героев Duo | n, wins | PlayerPair | наш | | вместе с парой |
| PlayerComparison | Снимок сравнения | два набора KPI | | наш, можно не хранить | эфемерный кэш | |
| Achievement | Порог, не мораль | rule id, n | Player | наш | P2 | |
| Leaderboard | Срез топа | metric, min n, window | | наш | P1 | ежедневно |

Отдельно хранить **DataSnapshot**: source, fetched_at, patch_letter_at_fetch, patch_bucket_id. UI читает freshness отсюда.

---

# 24. Caching / Freshness / Performance

Не анализировать всю историю игрока на каждый просмотр.

| Данные | Класс свежести | Кэш |
|---|---|---|
| Каталоги героев, патчей, модов | daily | 24 ч |
| Профиль игрока | near-real-time / hourly | 15 мин популярные, 60 мин остальные |
| Первая страница матчей | near-real-time | 5–15 мин |
| Parsed match | immutable после version | дни; инвалидация если был unparsed |
| Meta aggregate | hourly–daily | 6–24 ч |
| Duo aggregate | on-demand, затем кэш | 1 ч, ключ = пара + окно |
| Steam profile | hourly | 24 ч |

Политика:

- server-side cache и дедуп одинаковых запросов в полёте;
- retry с backoff на 429 и 5xx, без увеличения параллелизма;
- stale-while-revalidate: отдать старый снимок и подписать возраст, если источник душит;
- отдельные бюджеты на OpenDota, Steam, STRATZ;
- не обходить лимиты пулом ключей;
- популярные игроки и главная мета прогреваются фоном;
- пагинация обязательна;
- фоновый refresh владельца — очередь, не пачка запросов из браузера.

UI: «Данные OpenDota: обновлены X назад». Если X больше порога блока — предупреждение. Буква официального патча имеет свой timestamp «новость проверена Y».

Оценка объёма: полный разбор тысяч матчей игрока при 60 req/min без ключа занимает часы и упирается в дневной cap. Поэтому P0 показывает профиль, последние страницы и агрегаты, которые OpenDota уже посчитал (`/wl`, `/heroes`, `/peers`), а не самописный скан всей жизни.

---

# 25. Privacy / Security

Три корзины:

| Корзина | Примеры | Хранение |
|---|---|---|
| Публичные данные Dota | матчи, публичный ник, account id | кэш источника, не «секрет пользователя» |
| Аккаунт сервиса | user id, связка Steam, настройки, факт логина | минимум, удаляется по запросу |
| Импорт пользователя | нет в MVP. Не принимать replay-файлы и не просить пароль | — |

Правила:

- пароль Steam не запрашивается и не логируется;
- OpenID check только сервером;
- Steam Web API key только на сервере;
- STRATZ token только на сервере;
- сессия httpOnly, срок, logout, unlink;
- удаление аккаунта стирает User, сессии и наши агрегаты, привязанные к user id;
- публичные матчи не «удаляются из Dota» по запросу к нам; объяснять это в privacy notice;
- aliases не показывать списком;
- приватный профиль: показать, что видно, не добирать скрытое обходом;
- notice: какие источники, что id публичен, что оценка MMR не официальна, что Duo виден любому, кто знает оба публичных id.

---

# 26. Edge Cases / Failure States

| Случай | Поведение |
|---|---|
| Private / history hidden | Паспорт открывается. Блоки без данных — «история скрыта или недоступна», не нули. STRATZ-private не отменяет OpenDota-public: показать то, что источник реально отдал, с именем источника |
| Нет матчей | Empty state, поиск успешен |
| Частичная история | Прогресс «загружено N», итоги подписаны «по загруженному», не выдаются за lifetime |
| Новый аккаунт | Мало n, без рекомендаций |
| Очень старый | Patch id может не покрывать древние даты — «патч неизвестен» |
| Огромная история | Страницы, кэш агрегатов, не один запрос |
| Герой не найден | 404 каталога |
| Смена ника | Шапка = текущий persona. Старые ники не лента |
| Таймаут / 429 | Кэш + возраст + «источник ограничил запросы» |
| Источник лежит | Fallback из матрицы; если его нет — блок скрыт |
| Конфликт OpenDota vs STRATZ | Не усреднять. Badge источника в advanced |
| Неparsed | Матч без timeline |
| Режим без поддержки | Строка есть, в дефолтные KPI не входит |
| Ивент | Отдельная группа режимов |
| Смена патча | Старый bucket не подписывается новым. Буква 7.41f не дробит bucket 60 |
| Anonymous slot | «Скрытый игрок», Duo с ним не строится |
| Два одинаковых id в Duo | Ошибка ввода |
| Поиск ника дал много людей | Список, не автооткрытие |

---

# 27. MVP Scope

P0 — то, без чего три вопроса не задаются честно.

| Функция | Зависимость | Усилие | Данные | Ценность |
|---|---|---|---|---|
| Поиск SteamID64, profiles URL, vanity, ник-список | Steam key для vanity | S | Steam + OpenDota search | Вход |
| OpenID link своего профиля | OpenID | S | Steam | «Это мой паспорт» |
| Header + WL + last 20 + patch bucket | OpenDota player, wl, recent, patch table | M | VERIFIED | Вопрос A |
| Герои игрока с порогом n | `/heroes` подтвердить полями на старте реализации | M | DOCUMENTED | Вопрос A |
| Lane role mix | recent/matches lane_role | S | VERIFIED поле | Вопрос A без фейковых позиций |
| Режимы ranked AP / turbo / остальное | game_mode constants | S | VERIFIED | Честный срез |
| История матчей, базовые фильтры, страницы | matches query | M | DOCUMENTED + UI | Вопрос A |
| Страница матча: шапка и скорборд | `/matches/{id}` | M | DOCUMENTED | Доверие |
| Каталог героев + мета-таблица после фиксации полей heroStats | heroStats | M | endpoint VERIFIED, поля UNVERIFIED | Вопрос B в урезанном виде |
| Comparison двух игроков | два профиля | S | VERIFIED | Не путать с Duo |
| Duo: peers + same team list + пары героев + MVP score с Wilson | peers, included_account_id | L | VERIFIED | Вопрос C |
| Freshness и empty/error states | кэш | M | — | Доверие |
| Patch letter banner 7.41f vs bucket 7.41 | новости + constants | S | VERIFIED | Честность патча |

Вне P0 намеренно: Position 1–5 как факт, facet meta, ban rate, timeline реплея, Your Meta целиком, AI, share images, leaderboards, Role Impact, party-подтверждение для всех матчей (только флаг unknown).

---

# 28. P1 Scope

| Функция | Зависимость | Усилие | Данные | Ценность |
|---|---|---|---|---|
| Тренды игрока по окнам | агрегаты | M | matches | Форма |
| Мета по bracket, если поля heroStats или publicMatches это позволяют | валидация схемы | L | UNVERIFIED поля | Вопрос B |
| Matchups героя с подписью population | matchups endpoint | M | DOCUMENTED | Контекст |
| Предметы и способности parsed | match detail | L | schema | Матч |
| Your Meta квадранты | P0 мета + герои игрока | M | своё | Отличие |
| Player vs meta delta с интервалом | те же | M | своё | Отличие |
| Duo roles/lanes/timeline/H2H | список матчей | M | VERIFIED каркас | Duo глубже |
| Party flag по кэшированным parsed | party_id schema | M | schema, не list | Честность |
| STRATZ position, если схема подтвердится | токен, интроспекция | L | UNVERIFIED fields | Роли |
| Recommendations по правилам | Your Meta | M | своё | Польза без магии |
| Share URL preview + copy summary | страницы | S | своё | Распространение |
| Leaderboards с порогом n | агрегаты | L | своё | Осторожно |
| Request parse квота | OpenDota request | M | DOCUMENTED | Полнота матча |
| Role Impact с раскрытой формулой | benchmarks + роль | L | частично | Матч без чужого score |

---

# 29. P2 Scope

| Функция | Зависимость | Усилие | Данные | Ценность |
|---|---|---|---|---|
| Продвинутая synergy-модель с bracket matching | rank на матче, часто null | L | дырявый rank | Точнее Duo |
| AI-пересказ готовых карточек | карточки P1 | M | только факты карточек | Язык |
| Картинки-карточки | шаринг | M | те же числа | Соцсети |
| Achievements с порогами | агрегаты | M | своё | Возврат, риск токсичности |
| Patch letter split | нет поля | блокер | нет источника | Не обещать |
| Facet meta | словарь hero_variant | L | UNVERIFIED | Современная мета |
| Ward/profile, item timing signature | parsed выборка | L | schema | Глубина |
| Comeback / close-game | gold advantage arrays | M | schema parsed | Описательно |
| Глобальный hero synergy | нет дешёвого API | L | считать самим дорого | Не ядро |
| Community / guilds | нет | — | — | Не делаем |

---

# 30. Unique Differentiators

Пятнадцать идей. Приоритет после проверки данных.

| # | Имя | Проблема | Как работает | Данные | Сложность | Ценность | Уникальность | Приоритет |
|---|---|---|---|---|---|---|---|---|
| 1 | Duo story | Друзья не понимают совместные игры | 8 шагов раздела 17 | peers + included account | L | высокая | нет у трёх как продукта | P0 |
| 2 | Same team ≠ party | Ложный вывод «мы пати» | Флаг только по party_id | parsed schema | M | высокая | STRATZ умеет фильтр, мы делаем это явным текстом | P0 unknown / P1 yes |
| 3 | Independence synergy | Среднее WR врёт | logit baseline + Wilson | те же | M | высокая | своя формула | P0 |
| 4 | Wilson meta sort | 70% на 10 играх | сорт по lower bound | heroStats | M | высокая | Dotabuff показывает change, не interval | P0 |
| 5 | Patch letter banner | 7.41f думают, что уже в цифрах | два календаря | новости + constants | S | высокая | сайты склеивают | P0 |
| 6 | Source conflict badge | Цифры сайтов разные | не усреднять, подписать | живой кейс рангов | S | высокая | обычно скрыто | P0 |
| 7 | Player vs meta | «Имба или я» | delta только равных срезов | агрегаты | M | высокая | куски есть, целого нет | P1 |
| 8 | Your Meta | Чужая мета бесполезна | квадранты | игрок × мета | M | высокая | цель продукта | P1 |
| 9 | Playstyle Profile | Хочется «кто я» без эзотерики | доли lane, пула, длительности | матчи, n≥30 | M | средняя | вместо личности | P1 |
| 10 | Hidden mains | Много игр при среднем WR не видны в «топах WR» | сорт по n и близости к своему WR | герои игрока | S | средняя | обычно прячут | P1 |
| 11 | One-trick risk | Узкий пул ломается патчем | доля топ-1 героя и его delta после смены bucket | два patch id | M | средняя | связка с патчем | P1 |
| 12 | What changed | После патча «я разучился» | WR героев bucket N vs N-1, n обоих | matches patch filter | M | высокая | частичные тренды у конкурентов | P1 |
| 13 | Complementary pools | Чем закрыть друга | герои с малым перекрытием и разной lane role | Duo | M | высокая | следствие Duo | P1 |
| 14 | Inconclusive as a feature | Шум выглядят как инсайт | статус interval | Wilson | S | высокая | редко показывают | P0 |
| 15 | Public match without viewer login | Dotabuff закрывает историю | читать публичное без OpenID | OpenDota | S | высокая | отличие от Dotabuff | P0 |
| 16 | Close-game profile | «Винрейт клоунский, но игры равные» | доля parsed матчей с малым gold swing | schema | M | средняя | описательно | P2 |
| 17 | Comfort vs meta | Любимое против сильного | квадрант 8 | Your Meta | M | высокая | ядро отличия | P1 |

Дополнительные из обязательного списка и их доступность:

| Идея | Данные | Логика | n | Ценность | Приоритет |
|---|---|---|---|---|---|
| Duo streaks | список same-team по времени | серия W/L | показывать длину и даты | средняя | P1 |
| Hero-pair heatmap | пары | только клетки n≥5, остальные «мало» | 5 | высокая | P1 |
| Role matrix | lane × lane | WR и n | 15 для цвета-вывода | высокая | P1 |
| Teammate graph | peers with_games | топ связей, не «лучшие друзья» | with_games≥10 | средняя | P1 |
| Fingerprint | доли | вектор долей, сравнение косинусом как описание | 30 | средняя | P2 |
| Meta adaptation | смена пула после patch id | доля новых героев в топ-10 игр | 20 игр в каждом bucket | высокая | P1 |
| Draft first/last | draft_timings | только если поле есть | — | средняя | P2, часто нет данных |
| Objective tendency | roshans/towers schema | доля, не «стиль Макро» | parsed n≥20 | низкая–средняя | P2 |
| Item timing signature | purchase_log | медиана минуты, association | parsed n≥20 | средняя | P2 |
| Consistency | SD WR или результатов по окнам | дисперсия, подпись | ≥30 | средняя | P2 |

---

# 31. Risks / Constraints

| Риск | Почему реален | Что делаем |
|---|---|---|
| Дневной cap OpenDota | metadata 3000 и комментарий 2000/day | кэш, ключ, не сканировать историю мира |
| heroStats поля не те | тело не разобрано | первый шаг реализации — зафиксировать ключи, иначе мета не стартует |
| hero_variant бесполезен | все сэмплы 0 | facet meta стоп до словаря |
| MMR врёт | 4108 при Immortal leaderboard | не показывать в P0 |
| Патч-буква недоступна | constants кончаются на 7.41 | баннер, не фейковый фильтр |
| STRATZ схема закрыта без токена | GraphiQL без вызова | нулевые имена полей до интроспекции |
| Лимиты STRATZ устарели | KB 2020 | читать My Tokens, не хардкодить таблицу |
| GetMatchDetails сломан | комментарий OpenDota config | не строить склад на Valve matches |
| Private profile | видели на STRATZ при живом OpenDota | разный объём, подпись источника |
| Юридическое | Steam Web API terms, 100k/day, запрет на то, что Valve сочтёт нарушением | ключ, атрибуция, не выдавать себя за Valve |
| Токсичные топы | малые n | пороги |
| Множественные сравнения в Duo | сотни пар | мало карточек, приоритет n |
| Смена API | Dota и парсеры ломаются на патчах | словари снаружи, деградация блоков |
| Контент чужих сервисов | тексты, Hero Score, вёрстка | категории идей, не копии |

Дорогие функции: свой реплей-парсер, глобальная мета каждого bracket×position×day, полный party backfill всех матчей пары, live draft assistant.

---

# 32. Analytics Quality Checklist

Перед выпуском экрана:

- [ ] У числа есть окно: lifetime / last N / dates / patch bucket.
- [ ] Patch letter не подменяет bucket.
- [ ] Sample n виден там, где есть доля.
- [ ] Low sample не носит бейдж.
- [ ] Winning/best сортируется по Wilson LB, observed WR лежит рядом.
- [ ] Player vs meta сравнивает одну популяцию или пишет, что нет.
- [ ] Turbo не влит в ranked шапку.
- [ ] Lane role не назван позицией 1–5.
- [ ] Party не выведен из same team.
- [ ] MMR-оценка не названа MMR.
- [ ] Rank из двух источников не усреднён.
- [ ] Unparsed не притворяется полным разбором.
- [ ] Association не написана как причина.
- [ ] Рекомендация ссылается на n и срез.
- [ ] AI-текст, если есть, не содержит чисел вне карточки.
- [ ] Freshness виден.
- [ ] Пустое состояние не состоит из нулей.
- [ ] Источник назван в advanced.
- [ ] 429/timeout не выглядит как «у игрока 0 побед».

---

# 33. Acceptance Criteria

Сводка. Детальные критерии модулей — в секциях 10–17.

### Identity
- OpenID возвращает SteamID64, пароль не проходит через нас.
- Vanity URL резолвится или показывает ошибку Steam, не чужого игрока.
- Friend Code не обязателен.

### Player
- Разные периоды не склеены.
- Порог героя соблюдён.
- Ошибка источника отличима от пустой статистики.

### Matches
- Фильтры и страницы работают на публичном профиле без логина зрителя.
- Результат строки совпадает со стороной и `radiant_win`.

### Match
- Неparsed открывается без фиктивных графиков.

### Meta
- Сортировка Winning устойчива к малому n.
- Баннер буквы патча присутствует, пока буквы нет в данных.

### Comparison vs Duo
- Это разные URL и разные тексты.
- Duo не называет пару пати без `party_id`.
- Synergy score имеет n, baseline и статус интервала.

### Privacy
- Unlink и удаление аккаунта сервиса описаны и выполнимы.
- Aliases не вывалены на публичную страницу.

### Performance
- Повторный просмотр популярного игрока не порождает пачку одинаковых запросов к OpenDota.

---

# 34. Implementation Roadmap — WITHOUT CODE

1. Зафиксировать контракт OpenDota: реальные ключи `/heroStats`, `/players/{id}/heroes`, `/constants/lobby_type`, `/constants/region`, один parsed `/matches/{id}`. Всё несовпавшее остаётся UNVERIFIED и не попадает в UI.
2. Собрать словари: герои, моды, патчи, официальная буква из ленты новостей. Буква не хардкодится.
3. Идентичность: OpenID, vanity, SteamID64, сессия, unlink.
4. Чтение игрока: профиль, wl, recent, герои, кэш, freshness, empty states.
5. История и страница матча на двух уровнях полноты.
6. Мета-агрегат и страница героя в объёме подтверждённых полей.
7. Comparison.
8. Duo: peers, постраничный included account, same team, пары, score, H2H.
9. Наблюдение за 429 и возрастом кэша на реальном ключе. Только после этого P1: STRATZ-токен и интроспекция, позиции, Your Meta, recommendations.
10. P2 только если P0 честен на приватных, пустых и огромных профилях.

Порядок нельзя перевернуть ради графиков. Мета без понятых полей heroStats не выпускается «примерно похожей на Dotabuff».

---

# 35. Open Questions / Unverified Items

1. Единица `freeCallLimit: 3000` — календарный день или иное. Сверить заголовки ответа и страницу ключей OpenDota в день запуска.
2. Production per-minute с ключом: default репозитория 300, исторически обещали выше. Считать по фактическим заголовкам.
3. Имена полей `/heroStats`, наличие бана и бакетов ранга.
4. Смысл `hero_variant = 0` и словарь facet.
5. Отдаёт ли `project` party_id и denies в списке матчей.
6. Population `/heroes/{id}/matchups` сейчас: pro-only или шире.
7. Точный path и квота refresh и request parse.
8. Стабильность `/search` (вызов таймаутился).
9. Актуальные числа лимитов STRATZ на Default token.
10. Имена GraphQL-полей позиции, party, facet, performance. Не угадывать.
11. Совпадает ли lobby id 7 с ranked во всех текущих режимах — сверить constants.
12. Есть ли в матче ranked полный picks_bans или только pro.
13. Как часто `average_rank` null на ranked (в сэмпле recent он был null на pubs и заполнен на одном CM-матче).
14. Можно ли легально и устойчиво декодировать Friend Code. Пока не использовать в P0.
15. Расхождение pro name OpenDota и STRATZ: какое поле считать подписью. Решение: persona = OpenDota `personaname`; организация/про-имя показывать только с badge источника, если источники разошлись — показать оба, не выбирать «правильное» молча.
16. Обновлять букву патча из `https://www.dota2.com/news/updates/` при каждом research, не хранить 7.41f как вечную.

---

# 36. Слои продукта

| Слой | Вход | Преобразование | Выход | Ценность |
|---|---|---|---|---|
| Player Data | SteamID / account id | резолв, профиль, ранг | карточка личности | «кого смотрю» |
| Match Data | account id, match id | списки и parsed матч | строки и скорборд | проверяемые игры |
| Derived Analytics | матчи + словари | окна, WR, lane mix, Wilson | агрегаты со n | цифры, которым можно верить |
| Player Intelligence | агрегаты игрока | форма, пул, playstyle позже | паспорт | вопрос A |
| Hero Meta | heroStats / публичные агрегаты | срез, robust sort | таблица меты | вопрос B |
| Player vs Meta | паспорт × мета одного среза | delta и интервал | фраза или «неотличимо» | отличие от таблицы |
| Player Comparison | два паспорта | колонки | сравнение показателей | не путать с Duo |
| Duo Synergy | peers + общие матчи | same team, пары, baseline | история пары | вопрос C |
| Recommendations | квадранты | правила, не глобальный WR | карточки | что смотреть дальше |
| Community / Sharing | уже показанные числа | URL и текст | ссылка | переслать паспорт |

---

# 37. Финальный план

### Что строить первым
Поиск игрока, честный обзор (lifetime / last 20 / patch bucket), герои с порогом, lane role, режимы, список матчей, страница матча без фейкового timeline, грубая мета после проверки `heroStats`, comparison, Duo на peers и `included_account_id`.

### Что отложить
Свой парсер реплеев, facet-мета, Position 1–5 как факт, ban rate до появления поля, Role Impact, AI, картинки, лидерборды, буквенный сплит 7.41f, Friend Code, глобальный synergy всех героев, guilds, esports media.

### Какие API — основа
OpenDota read API для фактов матча и игрока. Steam OpenID и ResolveVanityURL / GetPlayerSummaries для личности. STRATZ GraphQL только как второй источник после интроспекции. Valve match API не как склад.

### Критические данные
`account_id`, результат матча (`radiant_win` + slot), герой, время, mode, lobby, patch id, K/D/A, список общих матчей, карта героев слотов, `lane_role`, n для любой доли. Без этого паспорт и Duo лгут.

### Основная ценность
Честные срезы игрока, мета без победы малой выборки, Duo с отделением команды, врага и пати.

### Дорогое и рискованное
Полный backfill историй, мета всех bracket×position, party для каждого матча пары, любой score «в одном числе», зависимость от STRATZ без своего кэша, обход приватных профилей.

### 3–5 отличий
1. Duo story с интервалом и baseline, а не peers-таблица.  
2. Баннер «буква патча ≠ статистический bucket».  
3. Сортировка меты по Wilson lower bound.  
4. Player vs meta и Your Meta только на сопоставимых срезах.  
5. Явный конфликт источников вместо усреднённого MMR и ранга.

### Полезность при ограниченном API
Профиль, последние матчи, герои, peers и одна страница общих матчей уже отвечают на три вопроса вчерне. Мета может стартовать одной глобальной таблицей patch bucket без бана и без позиций. Всё, чего нет, скрывается. Продукт остаётся полезным, пока не подменяет отсутствие данных нулями и чужими брендами метрик.

---

## Research log

| Проверка | Дата | Итог |
|---|---|---|
| Dota 2 news / Steam news 7.41f | 2026-09-29 | Патч от 15.09.2026, build 25329722 |
| `GET /constants/patch` | 2026-09-29 | Последний id 60 = 7.41 от 2026-03-24 |
| `GET /metadata` | 2026-09-29 | freeCallLimit 3000, freeRateLimit 60, premRateLimit 3000 |
| `GET /constants/game_mode` | 2026-09-29 | 0–25, turbo = 23, all draft = 22 |
| Player, wl, recentMatches, peers, included_account_id | 2026-09-29 | Поля, перечисленные в Research Findings |
| `GET /schema` | 2026-09-29 | parsed-колонки, включая party_id и hero_variant |
| `GET /heroStats` | 2026-09-29 | 200, ключи не извлечены |
| Dotabuff home, heroes, hero, player, player matches | 2026-09-29 | IA и логин-гейт истории |
| OpenDota player UI | 2026-09-29 | tabs и фильтры |
| STRATZ home, heroes, meta, player | 2026-09-29 | IA, stale meta window, private profile copy |
| Steamworks OpenID и Web API terms | 2026-09-29 | OpenID и 100k/day |
