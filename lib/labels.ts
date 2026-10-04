export const LANE_ROLE_LABEL: Record<number, string> = {
  0: "Не определена",
  1: "Лёгкая",
  2: "Мид",
  3: "Сложная",
  4: "Лес",
};

export function laneRoleLabel(id: number | null | undefined): string {
  if (id === null || id === undefined) return "Не определена";
  return LANE_ROLE_LABEL[id] ?? `unmapped lane role ${id}`;
}

const GAME_MODE_RU: Record<string, string> = {
  game_mode_unknown: "Другой режим",
  game_mode_all_pick: "All Pick",
  game_mode_captains_mode: "Captains Mode",
  game_mode_captains_draft: "Captains Draft",
  game_mode_random_draft: "Random Draft",
  game_mode_single_draft: "Single Draft",
  game_mode_all_random: "All Random",
  game_mode_all_draft: "All Draft",
  game_mode_turbo: "Turbo",
  game_mode_ability_draft: "Ability Draft",
  game_mode_1v1_mid: "1v1 Mid",
  game_mode_event: "Событие",
};

const LOBBY_RU: Record<string, string> = {
  lobby_type_normal: "Обычное",
  lobby_type_practice: "Практика",
  lobby_type_tournament: "Турнир",
  lobby_type_ranked: "Рейтинговое",
  lobby_type_ranked_team_mm: "Рейтинговое командное",
  lobby_type_ranked_solo_mm: "Рейтинговое соло",
  lobby_type_battle_cup: "Battle Cup",
  lobby_type_1v1_mid: "1v1 Mid",
  lobby_type_event: "Событие",
  lobby_type_coop_bots: "Боты",
};

export function constantLabel(name: string, dictionary: Record<string, string>): string {
  return dictionary[name] ?? name.replace(/^(game_mode_|lobby_type_)/, "").replaceAll("_", " ");
}

export function gameModeLabel(name: string | undefined): string {
  if (!name) return "Другой режим";
  return constantLabel(name, GAME_MODE_RU);
}

export function lobbyLabel(name: string | undefined): string {
  if (!name) return "Неизвестное лобби";
  return constantLabel(name, LOBBY_RU);
}

const REGION_RU: Record<string, string> = {
  "US WEST": "Запад США",
  "US EAST": "Восток США",
  EUROPE: "Европа",
  SINGAPORE: "Сингапур",
  DUBAI: "Дубай",
  AUSTRALIA: "Австралия",
  STOCKHOLM: "Стокгольм",
  AUSTRIA: "Австрия",
  BRAZIL: "Бразилия",
  SOUTHAFRICA: "Южная Африка",
  CHILE: "Чили",
  PERU: "Перу",
  INDIA: "Индия",
  JAPAN: "Япония",
  TAIWAN: "Тайвань",
  ARGENTINA: "Аргентина",
  "PW TELECOM SHANGHAI": "Шанхай",
  "PW UNICOM": "Китай",
  "PW TELECOM GUANGDONG": "Гуандун",
  "PW TELECOM ZHEJIANG": "Чжэцзян",
  "PW TELECOM WUHAN": "Ухань",
  "PW UNICOM TIANJIN": "Тяньцзинь",
};

export function regionLabel(name: string | undefined): string {
  if (!name) return "Регион";
  return REGION_RU[name] ?? name;
}
