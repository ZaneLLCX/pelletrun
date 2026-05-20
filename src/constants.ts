export type MazeCell = 'wall' | 'path';

export const MAZE_SIZE = 21; // Must be odd
export const CELL_SIZE = 4;
export const WALL_HEIGHT = 6;

export const PLAYER_WALK_SPEED = 5;
export const PLAYER_RUN_SPEED = 9;
export const PLAYER_SLOW_SPEED = 1.5;
export const STAMINA_DRAIN_RATE = 25; // per second
export const STAMINA_REGEN_RATE = 15; // per second
export const MAX_STAMINA = 100;

export const MONSTER_PATROL_SPEED = 4;
export const MONSTER_CHASE_SPEED = 9.5;
export const MONSTER_CHARGE_SPEED = 18;

export const DETECTION_RADIUS = 18;
export const HEARING_RADIUS_WALK = 8;
export const HEARING_RADIUS_RUN = 18;

export const CHASE_LOST_TIME = 2; // seconds to lose player
export const CHASE_LOST_PROBABILITY = 0.4;
