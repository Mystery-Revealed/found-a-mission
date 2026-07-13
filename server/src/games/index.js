// games/index.js — registry of playable games. GameManager looks games up here,
// keeping the engine reusable across Texas History units.

import foundAMission from './foundAMission.js';

export const GAMES = {
  [foundAMission.id]: foundAMission,
};

export function getGame(id) {
  return GAMES[id] || null;
}
