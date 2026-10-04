# MASTER PROMPT — Dota 2 Community Analytics Platform

## Роль агента

Ты работаешь как **Senior Product Manager + Product Researcher + Data Analyst + UX Architect + Technical Product Architect** для нового community-проекта вокруг Dota 2.

Твоя задача на этом этапе — **НЕ писать код и НЕ начинать реализацию**.

Твоя задача — сначала глубоко изучить рынок и источники данных, затем спроектировать продукт так, чтобы другой разработчик/ИИ-агент после тебя мог реализовать его без необходимости додумывать ключевые требования.

Ты должен мыслить не как генератор списка функций, а как человек, который проектирует полноценный аналитический сервис для Dota 2-комьюнити.

---

# 1. КОНТЕКСТ ПРОЕКТА

Я хочу создать свой отдельный сервис для Dota 2-комьюнити, посвящённый аналитике игроков, матчей, героев, меты и взаимодействия игроков.

Главная идея продукта:

> Пользователь вводит/подключает свой Steam-профиль, после чего сервис собирает доступные данные Dota 2 и превращает их в понятный, глубокий и визуально интересный аналитический профиль.

Кроме индивидуальной аналитики должен существовать второй ключевой модуль:

> Пользователь указывает двух игроков, и сервис анализирует их как дуэт: насколько часто они играли вместе, как меняется их результативность вместе, какие герои и роли образуют лучшие комбинации, какие позиции они занимают, насколько совпадают их игровые паттерны и т.д.

Цель — сделать продукт по уровню глубины сопоставимым с современными Dota 2-аналитическими сервисами, но не просто копировать их интерфейс. Необходимо сохранить ожидаемую пользователем полноту аналитики и при этом найти собственную сильную продуктовую идею.

---

# 2. ОБЯЗАТЕЛЬНЫЕ РЕФЕРЕНСЫ ДЛЯ ИССЛЕДОВАНИЯ

Ты ОБЯЗАН изучить актуальное состояние следующих ресурсов перед подготовкой спецификации:

1. https://www.dotabuff.com/
2. https://www.opendota.com/
3. https://stratz.com/

Также обязательно исследуй актуальные первичные источники данных и документацию:

4. https://docs.opendota.com/
5. https://developer.valvesoftware.com/
6. https://partner.steamgames.com/doc/features/auth
7. актуальные официальные новости/патчноуты Dota 2: https://www.dota2.com/news/updates/
8. актуальные официальные данные/документацию STRATZ API, если она доступна.

Можно использовать другие источники, но приоритет такой:

**официальная документация/API > официальные сайты самих аналитических сервисов > качественные community-источники.**

Не полагайся на старую статью, старый API или собственную память, если существует вероятность, что функциональность изменилась.

---

# 3. КРИТИЧЕСКИ ВАЖНО: ИССЛЕДОВАНИЕ ТРЁХ САЙТОВ

Не ограничивайся главными страницами.

Для каждого из трёх сервисов исследуй настолько глубоко, насколько позволяет доступ:

### DOTABUFF
Исследуй как минимум:
- Home
- Players
- Player profile
- Player overview
- Player matches
- Player heroes
- Hero mastery
- Items
- Records
- Scenarios
- Activity
- Trends
- Achievements
- Matchups
- Heroes
- Hero statistics
- Hero meta
- Hero positions/lanes
- Facets
- Match pages
- esports/competitive areas, если они влияют на продуктовую модель
- поиск и навигацию
- фильтры
- формы сортировки
- визуализации
- способы отображения win rate / pick rate / ban rate
- recent trends и изменения статистики

### OPENDOTA
Исследуй:
- Player profile
- Player overview
- Match history
- Heroes
- Peers / players played with
- Win/loss
- Counts by categories
- Histograms
- Totals
- Ratings/rank history
- Rankings
- Recent matches
- Ward map
- Wordcloud, если доступен
- Hero statistics
- Hero matchups
- Hero durations
- Hero players
- Scenario statistics
- Match details
- API structure
- фильтры и query parameters
- какие поля реально доступны

Обязательно отдельно изучи документацию OpenDota API и выдели реальные endpoint'ы, ограничения, параметры, sample fields и потенциальные rate limits.

### STRATZ
Исследуй:
- Player profiles
- Match history
- Player comparisons
- Hero statistics
- Hero positions
- Hero meta trends
- Hero synergies
- Hero counters
- item win rates
- builds
- ability builds
- talents
- guides
- draft analysis
- match analysis
- timeline/playback concepts
- Individual Match Performance / performance metrics
- leaderboards
- rank/skill segmentation
- guild/community functionality, если релевантно
- API/GraphQL
- какие аналитические сущности сервис строит поверх сырых матчей

Особое внимание удели тому, как STRATZ превращает сырые данные в производные аналитические сущности.

---

# 4. НЕ ПРЕДПОЛАГАЙ — ПРОВЕРЯЙ

Для каждой важной функции ответь:

1. Может ли её реально обеспечить доступный источник данных?
2. Каким API/endpoint/query она может быть получена?
3. Нужен ли Steam login?
4. Нужен ли публичный профиль?
5. Можно ли получить данные без Steam login?
6. Есть ли лимиты?
7. Является ли данные точными, рассчитанными или эвристическими?
8. Есть ли исторические ограничения?
9. Есть ли задержка обновления?
10. Может ли функция исчезнуть из-за изменения Valve/Dota/API?

Если функция кажется возможной, но её точная реализуемость не подтверждена — прямо пометь её как **UNVERIFIED**.

Никогда не выдумывай API endpoint'ы, поля, разрешения или гарантии доступности данных.

---

# 5. STEAM И ИДЕНТИФИКАЦИЯ ИГРОКА

Спроектируй несколько способов входа/поиска игрока:

### Основной вариант
**Sign in with Steam** через официальный механизм Steam OpenID/актуальный поддерживаемый Steam login flow.

После подтверждения нужно получать SteamID и связывать его с профилем нашего сервиса.

### Альтернативы поиска
Рассмотри:
- SteamID64
- Steam profile URL
- custom Steam profile URL
- display name / nickname как поисковый вариант
- Steam Friend Code как удобный пользовательский идентификатор

КРИТИЧЕСКИ ВАЖНО:

Не предполагай, что Friend Code автоматически является тем же идентификатором, который ожидает Dota API.

Проверь технически, существует ли надёжный и официально поддерживаемый способ преобразования Friend Code в SteamID/Steam account ID.

Если такой способ отсутствует или ненадёжен:
- не ломай концепцию;
- оставь Friend Code только как optional convenience input;
- предложи надёжные альтернативы: Steam login, profile URL, SteamID64.

Не требуй от пользователя вводить пароль Steam в наш сервис.

---

# 6. ЦЕЛЬ ПРОДУКТА

Продукт должен отвечать на три основных вопроса.

### Вопрос A — «Как я играю?»
Сервис должен построить максимально полезный профиль игрока:
- общий результат;
- текущая форма;
- любимые герои;
- лучшие/худшие герои;
- роли;
- позиции;
- игровые режимы;
- тенденции;
- сильные стороны;
- слабые стороны;
- история ранга;
- особенности матчей;
- напарники/оппоненты;
- патч-зависимые изменения;
- и другие значимые выводы.

### Вопрос B — «Что сейчас происходит в Dota?»
Сервис должен показывать текущую мету:
- популярность героя;
- win rate;
- pick rate;
- ban rate, если доступен;
- динамику;
- позицию/роль;
- rank/skill bracket;
- game mode;
- patch;
- date range;
- facets;
- synergies/counters, если доступны;
- item/build trends.

### Вопрос C — «Насколько мы хорошо играем вдвоём?»
Сервис должен сравнивать двух игроков:
- сколько матчей вместе;
- сколько побед;
- win rate вместе;
- на каких ролях играли;
- какие герои использовали;
- какие пары героев брали;
- лучшие комбинации;
- худшие комбинации;
- результаты при совпадающих позициях;
- результаты при разных позициях;
- результаты по режимам;
- результаты по периодам;
- результаты на текущем патче;
- какие игроки сильнее/слабее именно в конкретном совместном контексте;
- насколько их совместный результат отличается от индивидуального базового уровня.

---

# 7. ФУНКЦИОНАЛЬНАЯ ПАРИТЕТНОСТЬ

Проект должен рассматриваться как минимум как **feature-parity product** по ключевым аналитическим сценариям с DOTABUFF + OPENDOTA + STRATZ.

Но не надо буквально копировать:
- тексты;
- дизайн;
- UI-компоненты;
- брендинг;
- изображения;
- уникальные proprietary metrics;
- код;
- закрытые алгоритмы.

Наша задача — воспроизвести **категории полезной аналитики**, а не чужую реализацию.

Для каждого референса подготовь таблицу:

| Сервис | Функция | Что она делает | Ценность для пользователя | Источник данных | Нужна ли нам | Приоритет |
|---|---|---|---|---|---|---|

После этого объедини всё в единую продуктовую модель.

---

# 8. PLAYER PROFILE — ПОДРОБНАЯ СПЕЦИФИКАЦИЯ

Спроектируй Player Profile как полноценный аналитический центр.

Минимальный набор блоков:

## 8.1 Identity Header
- avatar;
- Steam nickname;
- Steam profile link;
- account identifier, если отображение безопасно и полезно;
- last match;
- current rank/medal, если доступно;
- historical rank;
- total matches;
- wins;
- losses;
- win rate;
- optional estimated/available MMR data, только если источник реально предоставляет это и это корректно маркируется.

## 8.2 Overall Performance
- matches;
- wins/losses;
- win rate;
- KDA;
- average kills/deaths/assists;
- GPM;
- XPM;
- last hits;
- denies;
- hero damage;
- tower/building damage;
- healing;
- teamfight participation, если возможно;
- duration;
- comeback / stomp / close-game statistics, если данные позволяют;
- consistency / volatility metrics, если статистически обоснованы.

## 8.3 Recent Form
Отдельно от lifetime stats.

Обязательные периоды:
- last 10;
- last 20;
- last 50;
- last 100;
- last 30 days;
- current patch.

Покажи динамику:
- win rate;
- KDA;
- average duration;
- role distribution;
- hero pool;
- performance trend.

Нельзя смешивать lifetime и current-patch data без явного обозначения.

## 8.4 Heroes
Для каждого героя, на котором игрок играл:
- games;
- wins;
- losses;
- win rate;
- KDA;
- role;
- lane;
- last played;
- recent win rate;
- current patch win rate;
- historical performance;
- whether the hero is a main/spam hero;
- sample size warning;
- percentile/rank among other players, если источник позволяет.

Нужно дать сортировки:
- most played;
- highest win rate;
- lowest win rate;
- best recent form;
- highest impact;
- most improved;
- current patch.

### ВАЖНО
Не показывай «лучший герой» только по 1–3 играм.
Нужны минимальные sample thresholds и/или статистическая корректировка.

---

# 9. РОЛИ И ПОЗИЦИИ

Определи отдельно:
- Core vs Support;
- Position 1 / Carry;
- Position 2 / Mid;
- Position 3 / Offlane;
- Position 4 / Soft Support / Roaming;
- Position 5 / Hard Support;
- Safe Lane;
- Mid Lane;
- Off Lane;
- Roaming;
- Jungle, если источник ещё предоставляет такую классификацию.

Нужно показать:
- долю матчей;
- wins;
- win rate;
- performance;
- hero pool;
- изменение роли во времени.

Используй наиболее надёжный доступный источник определения позиции, а не просто назначай позицию на основе субъективной логики.

---

# 10. GAME MODES И КАТЕГОРИИ МАТЧЕЙ

Профиль должен уметь разбивать игры хотя бы по:
- Ranked All Pick;
- Turbo;
- Unranked/Normal modes;
- other relevant standard modes;
- special events, если поддержка данных актуальна.

По каждой категории:
- games;
- wins;
- losses;
- win rate;
- average duration;
- performance metrics, если доступны.

Скрывай нерелевантные режимы по умолчанию, но не теряй данные.

---

# 11. MATCH HISTORY

Спроектируй полноценную историю матчей.

Каждая строка/карточка должна позволять увидеть:
- date/time;
- match ID;
- hero;
- result;
- duration;
- game mode;
- lobby type;
- rank/skill, если доступно;
- role/position;
- kills;
- deaths;
- assists;
- KDA;
- GPM;
- XPM;
- last hits;
- denies;
- key items;
- teammate/opponent context;
- party/team context, если доступно.

Нужны фильтры:
- date range;
- patch;
- mode;
- hero;
- role;
- position;
- win/loss;
- rank/skill bracket;
- region;
- teammate/opponent;
- duration;
- significant matches, если источник поддерживает.

Нужны:
- pagination;
- sorting;
- search where useful;
- responsive table/card view.

---

# 12. MATCH DETAIL

Спроектируй Match Page как отдельный глубокий аналитический экран.

Минимально:

## Match header
- result;
- radiant/dire;
- duration;
- mode;
- patch;
- date;
- match ID;
- rank/skill information;
- region;
- party information, если доступно.

## Draft
- all picks;
- bans;
- pick order/phase, если доступно;
- side;
- position assignment.

## Scoreboard
Для каждого из 10 игроков:
- hero;
- kills/deaths/assists;
- KDA;
- GPM;
- XPM;
- last hits;
- denies;
- net worth;
- hero damage;
- building damage;
- healing;
- teamfight metrics if available;
- items;
- abilities;
- talents;
- performance metric if supplied by source.

## Timeline
Графики/события по времени:
- net worth;
- XP;
- GPM/XPM;
- item purchase timings;
- level timings;
- ability timings;
- deaths;
- major objectives;
- wards;
- runes;
- Roshan/objective events, если данные доступны.

## Player Focus
Должен существовать режим, где пользователь выбирает одного игрока и получает:
- его build;
- item timings;
- ability build;
- talents;
- farm progression;
- combat stats;
- movement/ward info if available;
- contextual interpretation.

Не называй proprietary metric чужим брендом. Если нужен собственный performance score, спроектируй независимую модель с прозрачным названием и формулой.

---

# 13. HERO META

Это один из главных экранов продукта.

Нужны глобальные таблицы:
- All Heroes;
- Popular Heroes;
- Winning Heroes;
- Meta Snapshot;
- Trends;
- Position Meta;
- Facet Meta, если данные доступны.

Показывай:
- win rate;
- pick rate;
- ban rate;
- games/matches;
- change vs previous period;
- current patch;
- date range;
- position;
- skill bracket;
- game mode;
- facet.

Фильтры должны позволять сочетать условия, например:
- current patch + Ranked + Divine/Immortal + Mid.

---

# 14. META НЕ ДОЛЖНА БЫТЬ ПРОСТО СПИСКОМ WIN RATE

Это критическое требование.

Если герой имеет:
- 70% win rate на 10 играх;
- другой герой имеет 53% на 500,000 играх;

нельзя честно показать первого как однозначно «лучшего».

Спроектируй статистически корректную систему.

Рассмотри:
- minimum games threshold;
- confidence interval;
- Wilson score interval / lower bound;
- Bayesian shrinkage;
- sample-size weighting;
- recentness weighting;
- patch weighting.

Выбери и обоснуй метод.

Показывай пользователю как минимум:
- observed win rate;
- sample size;
- adjusted/robust rating, если он используется;
- confidence/sample warning.

Не создавай фальшивую точность.

---

# 15. HERO PAGE

Для каждого героя спроектируй глубокую страницу.

Блоки:
- overview;
- current win rate;
- pick rate;
- ban rate;
- trend;
- popularity;
- positions;
- role distribution;
- facets;
- builds;
- items;
- abilities;
- talents;
- item win rates;
- best allies / synergy;
- counters;
- bad matchups;
- duration distribution;
- rank brackets;
- game modes;
- patch history;
- top players/leaderboards, если источник позволяет;
- recent guides / successful games, если доступно.

---

# 16. PLAYER ↔ HERO ANALYSIS

Добавь отдельную аналитическую модель:

Для игрока + героя:
- lifetime games;
- lifetime win rate;
- current patch games;
- current patch win rate;
- recent games;
- recent win rate;
- position;
- role;
- performance;
- item/build patterns;
- lane outcomes if available;
- matchup performance;
- hero synergy with player's most common teammates.

Дополнительная ценность:

Сервис должен уметь отвечать на вопрос:

> «Ты много играешь этим героем, но насколько хорошо играешь им относительно собственных результатов на других героях и относительно меты?»

Для такого ответа используй сравнимые выборки и sample warnings.

---

# 17. PLAYER VS META

Это должно быть одной из уникальных особенностей продукта.

Для игрока можно вычислять:
- его win rate на hero;
- global win rate героя;
- delta игрока относительно global;
- player's role-specific delta;
- current-patch delta;
- performance percentile, если возможно.

Пример смысловой формулировки интерфейса:

> «На этом герое ты играешь на X п.п. выше/ниже глобального результата в сопоставимой выборке».

Но обязательно учитывай:
- rank bracket;
- position;
- game mode;
- patch;
- sample size.

Не сравнивай несопоставимые populations без предупреждения.

---

# 18. COUNTERS И MATCHUPS

Нужны два уровня:

### Hero-level
Как герой ведёт себя против других героев.

### Player-level
Как конкретный игрок выступает против/вместе с конкретными героями.

Покажи:
- games;
- wins;
- win rate;
- differential vs baseline;
- sample size.

Разделяй:
- teammate synergy;
- enemy matchup;
- lane matchup, если доступно.

---

# 19. СИНЕРГИЯ ДВУХ ИГРОКОВ — КЛЮЧЕВАЯ ОСОБЕННОСТЬ

Это один из главных отличительных модулей продукта.

Название рабочее: **Duo / Synergy / 2 Player Analysis**.

Пользователь вводит Player A и Player B.

Сервис должен построить совместный аналитический профиль.

---

# 20. ДАННЫЕ ДЛЯ DUO ANALYSIS

Минимально нужно собрать:
- shared matches;
- shared wins;
- shared losses;
- team win rate together;
- matches played on same team;
- heroes of A in shared games;
- heroes of B in shared games;
- role of A;
- role of B;
- lane of A;
- lane of B;
- game modes;
- patches;
- average duration;
- relevant performance metrics;
- whether the players were on the same side;
- if the source provides party data, whether the match was actually a party.

КРИТИЧЕСКИ ВАЖНО:

Не называй двух игроков «пати», если доказательство есть только в том, что они находились в одной команде.

Разделяй:
- same team;
- same party, если источник это подтверждает.

---

# 21. DUO OVERVIEW

Покажи:
- games together;
- wins together;
- losses together;
- win rate together;
- average duration;
- both individual lifetime win rates;
- both recent win rates;
- both current-patch win rates;
- number of shared matches in selected period.

Но не делай примитивный вывод вида:

«Игрок A 52%, Игрок B 54%, значит вместе будет 56%».

Это статистически неверно.

---

# 22. DUO SYNERGY SCORE

Разработай собственный понятный score, например на шкале 0–100, но он должен иметь методологическое основание.

Score не должен быть просто:

`(winrate A + winrate B) / 2`

или

`shared winrate * 100`.

Нужна модель, которая хотя бы концептуально учитывает:

1. shared win rate;
2. number of shared games;
3. individual baseline performance;
4. role compatibility;
5. hero-pair results;
6. lane compatibility;
7. current patch performance;
8. recent form;
9. game mode;
10. statistical uncertainty.

Для MVP допустима простая прозрачная модель.

Для будущей версии предложи более продвинутый вариант.

---

# 23. РЕКОМЕНДУЕМАЯ БАЗОВАЯ ИДЕЯ SYNERGY

Рассмотри подход:

### Step 1 — Baseline
Определи базовую вероятность победы каждого игрока в сопоставимых матчах.

### Step 2 — Shared Result
Определи фактический shared win rate.

### Step 3 — Synergy Delta
Вычисли разницу между observed shared performance и ожидаемым результатом.

Простейшая первая модель может исследовать:

`expected_duo = function(baseline_A, baseline_B)`

`synergy_delta = observed_duo_win_rate - expected_duo`

Однако НЕ считай эту формулу окончательной.

Ты должен исследовать более корректные варианты:
- logistic baseline;
- interaction term;
- shrinkage;
- matched contexts;
- confidence interval;
- sample weighting.

---

# 24. HERO PAIR SYNERGY

Это должна быть отдельная таблица.

Пример:

| Player A Hero | Player B Hero | Games | Wins | Win Rate | Sample confidence |
|---|---|---:|---:|---:|---|

Дополнительно:
- most played pair;
- best pair by robust win rate;
- worst pair;
- most stable pair;
- current patch pair;
- recent pair.

Но минимальный sample threshold обязателен.

Не показывай `100%` как значимый факт на 2 матчах.

---

# 25. ROLE SYNERGY

Сервис должен уметь отвечать:

> «В каких комбинациях ролей эти два игрока работают лучше всего?»

Например:
- Carry + Support;
- Mid + Support;
- Carry + Offlane;
- Mid + Offlane;
- etc.

Покажи:
- matches;
- win rate;
- hero-pair diversity;
- average performance.

---

# 26. LANE SYNERGY

Если доступна достоверная информация о lane:
- same lane;
- different lanes;
- safe lane pair;
- offlane pair;
- rotations/roaming;
- lane-specific result.

Покажи отдельную статистику.

Не делай выводы о «хорошей химии на линии» только из общего win rate.

---

# 27. HEAD-TO-HEAD

Помимо совместной игры, сделай отдельный сценарий:

> Player A vs Player B

Если в данных достаточно матчей, показать:
- сколько раз встречались как соперники;
- A wins;
- B wins;
- hero combinations;
- role combinations;
- recent encounters;
- current-patch encounters.

Это НЕ то же самое, что synergy.

---

# 28. DUO TIMELINE

Покажи, как их совместная игра менялась со временем:
- monthly;
- patch-based;
- recent 10/20/50 shared matches.

Графики:
- shared win rate;
- hero pair diversity;
- role combinations;
- average duration.

---

# 29. DUO «WHAT WORKS FOR US»

Это важный UX-слой.

Вместо сухих цифр сервис должен уметь сформировать аналитические карточки:

- чаще всего успешная комбинация героев;
- самая стабильная рольовая комбинация;
- лучший совместный патч;
- лучший game mode;
- наиболее успешный lane setup;
- hero pools that complement each other;
- common failure pattern;
- heroes one player can pick to enable the other.

Однако каждое такое утверждение должно иметь:
- sample size;
- выбранный период;
- контекст;
- confidence indicator.

---

# 30. PLAYER STYLE / ARCHETYPE

Рассмотри возможность автоматически описывать стиль игрока.

Но НЕ делай псевдопсихологические выводы.

Используй только наблюдаемые игровые данные.

Например:
- Core-heavy;
- support-heavy;
- hero specialist;
- hero variety;
- aggressive;
- farming-oriented;
- objective-oriented;
- high-duration player;
- fast-match player;

Только если каждое описание можно связать с измеряемыми признаками.

Лучше использовать название **Playstyle Profile**, а не «личность игрока».

---

# 31. PLAYER RECOMMENDATION ENGINE

Это потенциально очень полезный слой.

На основе статистики игрока предложи:

- heroes that fit player's historical strengths;
- meta heroes compatible with player's historical strengths;
- roles in which the player performs well;
- heroes to practice;
- heroes where player underperforms relative to meta;
- heroes with sufficient sample size and improving trend.

НЕ делай рекомендации только по глобальному win rate.

Учитывай:
- player's history;
- role;
- patch;
- skill bracket;
- hero familiarity;
- sample size.

---

# 32. «YOUR META»

Спроектируй персонализированную мету:

> Не «какие герои сильные вообще», а «какие герои и позиции сейчас выглядят наиболее релевантными именно этому игроку».

Показывай пересечение:

`Player Strength × Current Meta × Position × Skill Bracket × Patch`

Это может стать одной из основных уникальных особенностей продукта.

---

# 33. PATCH AWARENESS

Все данные должны быть patch-aware.

Для каждой мета/герой/игроковой статистики желательно знать:
- patch;
- date range;
- data freshness timestamp.

При смене патча:
- старую мету не смешивать с новой без явного обозначения;
- показывать before/after;
- учитывать, что герой мог быть существенно изменён.

Текущий patch нельзя хардкодить навсегда.

Агент должен определить его автоматически через свежий источник.

---

# 34. DATA FRESHNESS

У каждого типа данных определите:
- real-time;
- near-real-time;
- hourly;
- daily;
- on-demand refresh;
- cached.

UI должен показывать:

> Data updated X minutes ago

или аналогичное понятное значение.

Если данные устарели — пользователь должен это видеть.

---

# 35. DATA SOURCE STRATEGY

Создай матрицу источников:

| Данные | Valve/Steam | OpenDota | STRATZ | Другой источник | Основной | Fallback | Примечание |
|---|---|---|---|---|---|---|---|

Минимальные сущности:
- player identity;
- player profile;
- matches;
- heroes;
- hero stats;
- ranks;
- lanes;
- roles;
- items;
- abilities;
- talents;
- facets;
- teammates;
- opponents;
- draft;
- game mode;
- region;
- wards;
- performance;
- patch;
- hero matchup;
- hero synergy.

---

# 36. SOURCE OF TRUTH

Для каждого показателя выбери источник истины.

Не делай так, чтобы одна и та же метрика иногда бралась из OpenDota, иногда из STRATZ, и пользователь получал непредсказуемые цифры.

Если источники расходятся:
- выбери основной;
- документируй причину;
- при необходимости показывай source badge в advanced view.

---

# 37. FALLBACK STRATEGY

Если STRATZ недоступен:
- какие функции остаются через OpenDota?

Если OpenDota недоступен:
- какие функции остаются через другой источник?

Если только базовая информация доступна:
- профиль всё равно должен открываться;
- missing fields должны показываться корректно;
- UI не должен притворяться, что данных больше, чем реально есть.

---

# 38. API И RATE LIMITS

Проверь актуально:
- authentication requirements;
- API key requirements;
- free tier;
- rate limits;
- pagination;
- maximum page sizes;
- refresh endpoints;
- query complexity limits;
- caching requirements;
- terms/acceptable use.

Спроектируй слой:
- server-side caching;
- request deduplication;
- retry policy;
- stale-while-revalidate;
- per-source throttling;
- fallback source.

Не предлагай обход rate limits.

---

# 39. PRIVACY И STEAM LOGIN

Спроектируй:
- минимизацию хранимых данных;
- не хранить Steam password;
- token/session security;
- unlink account;
- data deletion;
- profile visibility;
- public vs private stats;
- privacy notice.

Раздели:
- данные, публично доступные из Dota ecosystem;
- данные, связанные с пользовательским аккаунтом нашего сервиса;
- данные, которые пользователь сам импортировал.

---

# 40. UX / INFORMATION ARCHITECTURE

Предложи полную структуру сайта.

Минимально исследуй такие разделы:

### Global navigation
- Home;
- Players;
- Heroes;
- Matches;
- Meta;
- Duo/Synergy;
- Leaderboards;
- Search;
- Login/Profile.

### Player navigation
- Overview;
- Matches;
- Heroes;
- Roles;
- Trends;
- Teammates;
- Opponents;
- Matchups;
- Builds;
- Achievements;
- Activity, если полезно.

### Hero navigation
- Overview;
- Meta;
- Positions;
- Matchups;
- Synergy;
- Builds;
- Items;
- Abilities;
- Facets;
- Patch history.

### Duo navigation
- Overview;
- Shared matches;
- Hero pairs;
- Roles;
- Lanes;
- Trends;
- Head-to-head;
- Recommendations.

---

# 41. SEARCH

Спроектируй глобальный поиск.

Пользователь должен максимально быстро найти:
- player;
- hero;
- match;
- team/pro player, если полезно.

Учитывай:
- Steam nickname;
- Steam profile URL;
- SteamID;
- partial search;
- aliases;
- hero names.

---

# 42. VISUALIZATION

Для каждой метрики выбери подходящий вид:

- KPI card;
- table;
- bar chart;
- line chart;
- heatmap;
- timeline;
- radar chart только если он действительно полезен;
- hero matrix;
- comparison bars;
- percentile chart;
- trend sparkline.

Не превращай дашборд в набор бессмысленных графиков.

Каждая визуализация должна отвечать на вопрос пользователя.

---

# 43. COMPARISON MODE

Помимо Duo Synergy нужен классический режим сравнения.

Например:

Player A | Player B

Сравни:
- total matches;
- win rate;
- recent win rate;
- current patch;
- favorite heroes;
- roles;
- lanes;
- game modes;
- KDA;
- GPM;
- XPM;
- rank history;
- hero pool diversity;
- shared heroes;
- unique strengths.

Важно:

Классическое **comparison** и аналитическое **synergy** — разные сущности.

Comparison = «какие у них показатели».

Synergy = «что происходит, когда они играют вместе».

---

# 44. LEADERBOARDS

Рассмотри:
- top heroes;
- best hero win rates with sample threshold;
- hero specialists;
- highest hero mastery;
- highest performance;
- rank-based leaderboards;
- regional leaderboards;
- current patch leaderboards.

Не создавай токсичные или misleading рейтинги без достаточной выборки.

---

# 45. UNIQUE FEATURES — ОБЯЗАТЕЛЬНО ПРИДУМАЙ

После исследования конкурентов предложи минимум **15 уникальных идей**, которые не являются простым копированием.

Для каждой:
- название;
- user problem;
- how it works;
- required data;
- difficulty;
- value;
- uniqueness;
- MVP/P2/P3.

Особенно исследуй идеи в направлении:
- personalized meta;
- player-vs-meta;
- duo synergy;
- duo hero combinations;
- playstyle fingerprint;
- patch evolution;
- «what changed in my game»;
- «why my duo works/doesn't work»;
- automatic player summary;
- community sharing;
- shareable profile cards;
- comparison links;
- compact social summaries;
- challenge/achievement systems;
- historical milestones.

---

# 46. SHAREABILITY

Dota-комьюнити активно обменивается профилями и статистикой.

Спроектируй:
- shareable player URL;
- shareable hero URL;
- shareable duo URL;
- image/stat card generation concept;
- copyable compact summary;
- social preview metadata;
- anonymized sharing option, если это полезно.

---

# 47. «WOW FACTOR»

Продукт должен выдавать не только таблицы.

Продумай несколько моментов, когда пользователь думает:

> «О, я реально узнал что-то новое о своей игре».

Например:
- «Ты сыграл X% матчей на одной позиции»;
- «Твой результат на этом герое на Y п.п. отличается от меты твоего bracket»;
- «С этим игроком вы сыграли N матчей и чаще всего выигрывали через комбинацию A+B»;
- «После патча X твой win rate на героях типа Y изменился».

Каждое statement должно быть проверяемым по данным.

---

# 48. AI / NATURAL LANGUAGE ANALYSIS

Можно предложить AI-слой, но он должен быть надёжно ограничен данными.

AI может:
- объяснить статистику;
- сформировать summary;
- выделить trends;
- объяснить изменения;
- предложить вопросы для дальнейшего анализа.

AI НЕ должен:
- придумывать данные;
- писать прогнозы без основания;
- выдавать догадки за факты;
- утверждать наличие причины, если данные показывают только корреляцию.

Все AI-выводы должны ссылаться на фактические метрики, sample sizes и период.

---

# 49. АНАЛИТИЧЕСКАЯ ДОСТОВЕРНОСТЬ

Создай отдельный раздел **Statistical Integrity**.

Определи:
- minimum sample sizes;
- confidence intervals;
- uncertainty presentation;
- multiple comparison concerns;
- patch segmentation;
- rank segmentation;
- mode segmentation;
- role segmentation;
- data completeness.

Когда выборка слишком мала:
- не скрывай данные полностью без причины;
- но визуально маркируй их как low sample;
- не используй их для сильных выводов.

---

# 50. КОРРЕЛЯЦИЯ НЕ РАВНА ПРИЧИННОСТИ

Особенно важно для:
- player synergy;
- item win rates;
- hero counters;
- role performance;
- build recommendations.

Например:

«Игрок покупал предмет X и чаще выигрывал»

не означает

«предмет X повысил вероятность победы».

В спецификации чётко разделяй:
- observed association;
- descriptive metric;
- modeled estimate;
- recommendation.

---

# 51. PERFORMANCE SCORE

Если ты предлагаешь свой общий performance score игрока или матча:

Он должен:
- иметь понятное название;
- иметь диапазон;
- иметь методологию;
- быть воспроизводимым;
- быть независимым от чужого proprietary score;
- показывать, из каких компонентов он состоит;
- учитывать роль/позицию, если это важно.

Не создавай score только из KDA.

---

# 52. ОСОБЫЕ СЛУЧАИ

Продумай поведение при:
- private profile;
- отсутствующей match history;
- частично загруженной history;
- newly created account;
- очень старом аккаунте;
- huge match history;
- hero not found;
- deleted/changed nickname;
- API timeout;
- source outage;
- conflicting data;
- incomplete replay parse;
- unsupported mode;
- special event;
- patch transition.

---

# 53. ПРОИЗВОДИТЕЛЬНОСТЬ

При проектировании учти:
- многомиллионный объём Dota матчей;
- частые запросы популярных игроков;
- популярные hero meta pages;
- simultaneous users;
- API caching;
- pagination;
- precomputed aggregates;
- background data refresh;
- on-demand refresh.

Не пытайся каждый раз заново анализировать всю историю игрока, если это можно решить агрегатами.

---

# 54. CONCEPTUAL DATA MODEL

Не пиши код.

Но спроектируй сущности и связи.

Минимальные сущности:
- User;
- SteamIdentity;
- Player;
- Match;
- MatchPlayer;
- Team;
- Hero;
- HeroFacet;
- Item;
- Ability;
- Talent;
- Patch;
- GameMode;
- Role;
- Lane;
- PlayerHeroStats;
- PlayerRoleStats;
- PlayerTrend;
- HeroMetaStats;
- HeroMatchup;
- HeroSynergy;
- PlayerPair;
- PlayerPairMatch;
- HeroPairStats;
- PlayerComparison;
- Achievement;
- Leaderboard.

Для каждой сущности опиши:
- назначение;
- ключевые поля;
- связи;
- source of truth;
- жизненный цикл;
- refresh strategy.

---

# 55. MVP

После полного анализа не пытайся реализовать сразу всё.

Выдели:

## MVP P0
То, без чего продукт не имеет смысла.

Вероятно сюда войдут:
- Steam/player lookup;
- player overview;
- match history;
- heroes;
- roles/positions;
- basic hero meta;
- match details;
- player comparison;
- duo synergy basic version.

Но не принимай эту структуру на веру — скорректируй после research.

## P1
Сильное расширение:
- trends;
- advanced hero meta;
- hero matchups;
- hero pairs;
- item/ability analysis;
- personalized meta;
- richer duo analytics.

## P2
Продвинутые функции:
- advanced performance models;
- AI summaries;
- share cards;
- advanced recommendations;
- community/leaderboard layers;
- historical patch intelligence.

Для каждой функции дай:
- priority;
- dependency;
- effort;
- data requirement;
- user value.

---

# 56. НЕ ПИШИ КОД

Это очень важно.

На этом этапе запрещено выдавать:
- React-код;
- backend-код;
- SQL;
- Python;
- API implementation code;
- CSS;
- конкретные файлы проекта;
- CI/CD configuration;
- deployment scripts.

Разрешено:
- conceptual schemas;
- flow diagrams в текстовом виде;
- псевдологика;
- formulas;
- API endpoint references;
- acceptance criteria;
- product requirements;
- UI specification.

---

# 57. НЕ ВЫДУМЫВАЙ ПАРАМЕТРЫ

Когда ты ссылаешься на API:

Пиши только реально подтверждённые endpoint'ы/поля.

Если поле/endpoint не подтверждён:

`UNVERIFIED — needs API validation`

Не придумывай GraphQL query names.

---

# 58. ИССЛЕДОВАНИЕ ДОЛЖНО БЫТЬ ДИНАМИЧЕСКИМ

Поскольку Dota постоянно обновляется:

- не считай текущий patch постоянным;
- не считай hero roster постоянным;
- не считай game modes постоянными;
- не считай API schema постоянной;
- не считай ranking logic постоянной.

В продуктовой спецификации должны быть механизмы адаптации к новым патчам.

---

# 59. ОТЧЁТ, КОТОРЫЙ ТЫ ДОЛЖЕН ВЫДАТЬ

Твой ответ должен быть оформлен как профессиональный Product Requirements Document.

Структура обязательна:

## 1. Executive Summary

## 2. Product Vision

## 3. Target Users

## 4. User Problems

## 5. Competitive Research
Сравнение DOTABUFF / OPENDOTA / STRATZ.

## 6. Feature Parity Matrix

## 7. Data Source & API Matrix

## 8. Steam Identity & Authentication Strategy

## 9. Product Information Architecture

## 10. Player Profile Specification

## 11. Match History Specification

## 12. Match Detail Specification

## 13. Hero Meta Specification

## 14. Hero Page Specification

## 15. Player vs Meta Specification

## 16. Player Comparison Specification

## 17. Duo/Synergy Specification

## 18. Statistical Methodology

## 19. Personalized Meta

## 20. Recommendations

## 21. Shareability / Community Features

## 22. UX Principles

## 23. Conceptual Data Model

## 24. Caching / Freshness / Performance

## 25. Privacy / Security

## 26. Edge Cases / Failure States

## 27. MVP Scope

## 28. P1 Scope

## 29. P2 Scope

## 30. Unique Differentiators

## 31. Risks / Constraints

## 32. Analytics Quality Checklist

## 33. Acceptance Criteria

## 34. Implementation Roadmap — WITHOUT CODE

## 35. Open Questions / Unverified Items

---

# 60. ACCEPTANCE CRITERIA

В конце каждого крупного модуля дай acceptance criteria.

Пример:

### Player Overview — Acceptance Criteria
- Пользователь может найти игрока по поддерживаемому идентификатору.
- Профиль показывает lifetime и recent stats отдельно.
- Каждая статистика имеет корректный период.
- Low-sample statistics маркируются.
- Изменение patch не смешивается с предыдущим patch.
- Ошибка API отображается понятным состоянием.
- Данные имеют timestamp/freshness indicator.

Но составь полный набор самостоятельно.

---

# 61. PRODUCT DECISION LOGIC

Для спорных решений используй порядок приоритетов:

1. Достоверность данных.
2. Пользовательская ценность.
3. Понятность.
4. Поддерживаемость.
5. Производительность.
6. Красивый интерфейс.
7. Дополнительные декоративные функции.

Не жертвуй достоверностью ради эффекта «вау».

---

# 62. ТРИ УРОВНЯ ИНФОРМАЦИИ

Каждый экран должен иметь:

### Layer 1 — Instant
Пользователь за 3–5 секунд понимает главное.

### Layer 2 — Explore
Пользователь может изучить детали.

### Layer 3 — Deep Analytics
Продвинутый пользователь может изучить сырые/детальные показатели.

Примени это к:
- player;
- hero;
- match;
- duo.

---

# 63. НЕ ПЕРЕГРУЖАЙ UI

Даже если данных очень много:

- важное выше;
- детали ниже;
- advanced filters скрыты под раскрываемыми контролами;
- mobile не должен быть поломан;
- таблицы должны иметь альтернативное представление на узком экране.

---

# 64. ОСОБЫЙ АКЦЕНТ НА DUO EXPERIENCE

Это потенциальный главный отличительный продуктовый модуль.

Спроектируй его так, чтобы после анализа двух игроков сервис рассказывал небольшую историю:

### «Ваши цифры»
Краткая сводка.

### «Как вы играете вместе»
Совместные результаты.

### «На чём вы сильнее всего»
Hero pair analysis.

### «Какие роли вам подходят»
Role synergy.

### «Что работает сейчас»
Current patch duo stats.

### «Что изменилось»
Recent duo trend.

### «Против чего вы сильнее/слабее»
Opponent context, если данных достаточно.

### «Ваш совместный профиль»
Сводный playstyle pattern на основе реально наблюдаемых показателей.

---

# 65. ДОПОЛНИТЕЛЬНЫЕ ИДЕИ, КОТОРЫЕ ТЫ ДОЛЖЕН ИССЛЕДОВАТЬ

Не ограничивайся моим описанием.

После исследования предложи функции, которые логично вытекают из имеющихся данных, например:
- duo streaks;
- hero-pair heatmap;
- role compatibility matrix;
- most played teammate graph;
- teammate network;
- player fingerprint;
- patch evolution;
- hero pool diversity score;
- meta adaptation score;
- comfort-vs-meta score;
- «hidden mains»;
- «one trick risk»;
- comeback profile;
- close-game profile;
- average game tempo;
- draft tendencies;
- first-pick/last-pick patterns, если данные доступны;
- objective tendencies;
- warding profile;
- item timing signatures;
- ability/talent tendencies;
- performance consistency;
- hero pool overlap for two players;
- complementary hero pool recommendations.

Для каждой новой идеи обязательны:
- data availability;
- formula/logic concept;
- sample requirement;
- value;
- implementation priority.

---

# 66. ИТОГОВАЯ ПРОДУКТОВАЯ МОДЕЛЬ

После всей аналитики сформулируй продукт одной структурной схемой:

`Player Data`
→ `Match Data`
→ `Derived Analytics`
→ `Player Intelligence`
→ `Hero Meta`
→ `Player vs Meta`
→ `Player Comparison`
→ `Duo Synergy`
→ `Personalized Recommendations`
→ `Community / Sharing`

Для каждого слоя укажи:
- входные данные;
- преобразование;
- выход;
- пользовательскую ценность.

---

# 67. ФИНАЛЬНЫЙ ВЫВОД

В конце НЕ пиши просто «это хороший проект».

Дай конкретный план:

### Что строить первым
### Что обязательно отложить
### Какие API использовать как основу
### Какие данные являются критическими
### Какие функции дают основную ценность
### Какие функции являются дорогими/рискованными
### Какие 3–5 функций могут стать главным отличием проекта
### Как сделать продукт полезным даже при ограниченном API

Не выбирай стек программирования, если это не требуется для обоснования архитектуры.

---

# 68. КАЧЕСТВО ОТВЕТА

Твой ответ должен быть:
- конкретным;
- структурированным;
- технически реалистичным;
- основанным на актуальном research;
- без маркетинговой воды;
- без кода;
- без выдуманных API;
- без псевдонаучных выводов;
- с чётким разграничением фактов, предположений и UNVERIFIED пунктов.

Каждое важное решение объясняй коротко: **что, зачем, откуда данные, какие ограничения.**

---

# 69. ОБЯЗАТЕЛЬНЫЙ RESEARCH OUTPUT

Перед PRD сначала выдай короткий раздел:

## Research Findings

В нём дай:

### DOTABUFF
- ключевые пользовательские разделы;
- важные метрики;
- сильные UX-концепции;
- уникальные/интересные функции.

### OPENDOTA
- ключевые функции;
- доступные API entities;
- реальные player/match/hero endpoints;
- сильные стороны данных.

### STRATZ
- ключевые функции;
- глубокие аналитические сущности;
- API capabilities;
- player/hero/match/guide analytics.

После этого уже строй собственный продукт.

---

# 70. ОБЯЗАТЕЛЬНО СТРОЙ FEATURE MAP

Создай карту:

### Shared by competitors
Что есть у большинства.

### Best-in-class ideas
Что особенно полезно у конкретного сервиса.

### Missing opportunity
Что можно объединить лучше.

### Unique product opportunity
Что можно сделать принципиально интереснее.

Это нужно для того, чтобы проект не был просто «четвёртым Dotabuff».

---

# 71. ИДЕЯ ПРОДУКТА, КОТОРУЮ НУЖНО ПРОВЕРИТЬ

Проверь гипотезу:

> **«Dota Analytics Passport» / «Dota Player Intelligence»**

Каждый игрок получает не просто профиль статистики, а структурированный цифровой аналитический профиль:
- кто я как игрок;
- во что я играю;
- что у меня получается;
- где я отклоняюсь от меты;
- как менялся мой стиль;
- с кем я лучше всего взаимодействую;
- какие hero pools лучше всего дополняют моих друзей;
- как я меняюсь от патча к патчу.

Это только гипотеза. Не принимай её автоматически как финальную концепцию.

Сравни её с другими идеями и определи, как превратить её в максимально сильную продуктовую концепцию без использования субъективного «лучший/хуже».

---

# 72. ВАЖНАЯ ОГОВОРКА О ДАННЫХ

Большая часть аналитики строится на public match/replay data.

Поэтому в спецификации явно укажи:
- что значит «public»;
- какие данные могут отсутствовать;
- почему цифры разных сервисов могут различаться;
- почему recent data и lifetime data нельзя смешивать;
- почему patch/rank/mode filtering важен;
- почему sample size важен.

---

# 73. ТРЕБОВАНИЕ К ТЕКУЩЕМУ СОСТОЯНИЮ DOTA

При исследовании текущего продукта всегда используй актуальную дату.

На момент подготовки этого задания дата контекста — **29 сентября 2026 года**, а официально опубликованный на данный момент gameplay patch — **7.41f от 15 сентября 2026 года**.

Однако НЕ хардкодь это как вечное значение.

Проверь актуальный patch непосредственно в момент research и укажи в отчёте, какой patch фактически использовался для анализа текущей меты.

---

# 74. ФОРМАТ ФИНАЛЬНОГО ОТВЕТА АГЕНТА

Используй Markdown.

Используй много таблиц там, где это повышает точность.

Не пиши огромные бессмысленные абзацы.

Для каждой функции, где важны данные, желательно использовать формат:

**Feature**

**Purpose:**

**Input:**

**Source:**

**Calculation:**

**UI:**

**Filters:**

**Edge cases:**

**Sample requirements:**

**Priority:**

**Acceptance criteria:**

---

# 75. ГЛАВНОЕ ПРАВИЛО

**Сначала исследуй. Потом синтезируй. Потом проектируй. Не начинай кодить.**

Ты должен закончить работу не набором идей, а документом, который превращает идею в конкретный, реалистичный и проверяемый продуктовый план.
