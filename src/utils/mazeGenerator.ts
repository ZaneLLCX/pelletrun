import { MazeCell } from '../constants';

export function generateMaze(size: number): MazeCell[][] {
  const maze: MazeCell[][] = Array(size).fill(null).map(() => Array(size).fill('wall'));

  const stack: [number, number][] = [];
  const start: [number, number] = [1, 1];
  maze[start[1]][start[0]] = 'path';
  stack.push(start);

  const directions = [
    [0, 2], [0, -2], [2, 0], [-2, 0]
  ];

  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1];
    const neighbors: [number, number, number, number][] = [];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 'wall') {
        neighbors.push([nx, ny, x + dx / 2, y + dy / 2]);
      }
    }

    if (neighbors.length > 0) {
      const [nx, ny, px, py] = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[ny][nx] = 'path';
      maze[py][px] = 'path';
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }

  // Ensure some loops for more interesting gameplay
  for (let i = 0; i < size * 2; i++) {
    const rx = Math.floor(Math.random() * (size - 2)) + 1;
    const ry = Math.floor(Math.random() * (size - 2)) + 1;
    if (maze[ry][rx] === 'wall') {
      let neighborsPaths = 0;
      if (maze[ry + 1][rx] === 'path') neighborsPaths++;
      if (maze[ry - 1][rx] === 'path') neighborsPaths++;
      if (maze[ry][rx + 1] === 'path') neighborsPaths++;
      if (maze[ry][rx - 1] === 'path') neighborsPaths++;
      
      if (neighborsPaths >= 2) {
        maze[ry][rx] = 'path';
      }
    }
  }

  return maze;
}

export function getPathCells(maze: MazeCell[][]): [number, number][] {
  const paths: [number, number][] = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 'path') {
        paths.push([x, y]);
      }
    }
  }
  return paths;
}
