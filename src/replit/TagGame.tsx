import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, HelpCircle, FastForward, Hammer, ArrowRight } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  elevation: number; // Added elevation for terrain features
  isVisited?: boolean; // Used for maze generation algorithms
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
  robotPaths: { robotId: number; color: string }[];
}

interface Robot {
  id: number;
  x: number;
  y: number;
  isIt: boolean;
  path: Cell[];
  pathIndex: number;
  color: string;
  lastTagTime: number;
  status: string;
  movements: Movement[]; // Each robot has its own movement history
}

interface Movement {
  robotId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'move' | 'tag';
  timestamp: number;
}

interface TagGameProps {
  width?: number;
  height?: number;
  wallDensity?: number;
  robotCount?: number;
  terrainIntensity?: number;  // Added terrain intensity parameter
}

type MazeAlgorithm = 'none' | 'recursive-backtracking' | 'prims' | 'recursive-division';

const TagGame: React.FC<TagGameProps> = ({ 
  width = 20, 
  height = 15, 
  wallDensity = 0.3, 
  robotCount = 4,
  terrainIntensity = 0.5  // Default terrain intensity
}) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [editMode, setEditMode] = useState(false);
  const [lastTagLocation, setLastTagLocation] = useState<{ x: number, y: number } | null>(null);
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [expandedRobot, setExpandedRobot] = useState<number | null>(null);
  const [mazeAlgorithm, setMazeAlgorithm] = useState<MazeAlgorithm>('none');
  const [widthInput, setWidthInput] = useState(width.toString());
  const [heightInput, setHeightInput] = useState(height.toString());
  const [wallDensityInput, setWallDensityInput] = useState(wallDensity.toString());
  const [terrainIntensityInput, setTerrainIntensityInput] = useState(terrainIntensity.toString());
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const colors = ['blue', 'red', 'green', 'purple', 'orange'];
  const TAG_COOLDOWN = 2000;
  const UNIVERSAL_CLOCK = 1000;
  const MAX_MOVEMENTS = 10; // Maximum number of movements to store per robot

  // Define helper functions
  const initializeMaze = (allWalls: boolean = false) => {
    const newMaze: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          isWall: allWalls,
          isPath: false,
          elevation: 50, // Default elevation
          isVisited: false, // Initialize as not visited
          f: 0,
          g: 0,
          h: 0,
          parent: null,
          robotPaths: []
        });
      }
      newMaze.push(row);
    }
    return newMaze;
  };
  
  // Helper function for recursive backtracking maze generation
  const getUnvisitedNeighbors = (cell: Cell, maze: Cell[][], step: number = 2) => {
    const neighbors: Cell[] = [];
    const directions = [
      { x: 0, y: -step },  // Up
      { x: step, y: 0 },   // Right
      { x: 0, y: step },   // Down
      { x: -step, y: 0 }   // Left
    ];

    for (const dir of directions) {
      const newX = cell.x + dir.x;
      const newY = cell.y + dir.y;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isVisited) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
  };
  
  // Generate a maze using recursive backtracking
  const generateRecursiveBacktrackingMaze = () => {
    const newMaze = initializeMaze(true);
    const stack: Cell[] = [];
    const start = newMaze[0][0];
    start.isWall = false;
    start.isVisited = true;
    stack.push(start);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getUnvisitedNeighbors(current, newMaze);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        next.isVisited = true;
        next.isWall = false;

        const dx = next.x - current.x;
        const dy = next.y - current.y;
        newMaze[current.y + dy/2][current.x + dx/2].isWall = false;

        stack.push(next);
      }
    }

    return newMaze;
  };

  // Improved findRandomEmptyCell that scans all available positions and randomly selects one
  const findRandomEmptyCell = (currentMaze: Cell[][], excludePositions: Set<string>) => {
    // Find all available cells
    const availableCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!currentMaze[y][x].isWall && !excludePositions.has(`${x},${y}`)) {
          availableCells.push({x, y});
        }
      }
    }
    
    // If no cells are available, return a default position
    if (availableCells.length === 0) {
      return { x: 1, y: 1 };
    }
    
    // Return a random available cell
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
  };

  // Generate diamond-square terrain
  const generateTerrain = (newMaze: Cell[][]) => {
    // Get current values from form inputs
    const currentWidth = parseInt(widthInput) || width;
    const currentHeight = parseInt(heightInput) || height;
    const currentTerrainIntensity = parseFloat(terrainIntensityInput) || terrainIntensity;
    
    const size = Math.max(currentWidth, currentHeight);
    const maxSize = Math.pow(2, Math.ceil(Math.log2(size)));
    
    // Set initial corner elevations
    newMaze[0][0].elevation = Math.random() * 100;
    newMaze[0][Math.min(currentWidth-1, maxSize-1)].elevation = Math.random() * 100;
    newMaze[Math.min(currentHeight-1, maxSize-1)][0].elevation = Math.random() * 100;
    newMaze[Math.min(currentHeight-1, maxSize-1)][Math.min(currentWidth-1, maxSize-1)].elevation = Math.random() * 100;

    const generateStep = (x: number, y: number, size: number, offset: number) => {
      if (size < 2) return;

      const half = size / 2;
      const scale = currentTerrainIntensity * size;

      // Diamond step - calculate center point
      if (x + half < width && y + half < height) {
        const avg = (
          newMaze[y][x].elevation +
          newMaze[y][Math.min(x + size, width - 1)].elevation +
          newMaze[Math.min(y + size, height - 1)][x].elevation +
          newMaze[Math.min(y + size, height - 1)][Math.min(x + size, width - 1)].elevation
        ) / 4;
        
        newMaze[y + half][x + half].elevation = 
          Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * scale));
      }

      // Square step - calculate midpoints of each side
      const points = [
        [x + half, y],
        [x + size, y + half],
        [x + half, y + size],
        [x, y + half]
      ];

      for (const [px, py] of points) {
        if (px < width && py < height) {
          const values = [];
          if (py - half >= 0) values.push(newMaze[py - half][px].elevation);
          if (py + half < height) values.push(newMaze[py + half][px].elevation);
          if (px - half >= 0) values.push(newMaze[py][px - half].elevation);
          if (px + half < width) values.push(newMaze[py][px + half].elevation);
          
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          newMaze[py][px].elevation = 
            Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * scale));
        }
      }

      // Recursive calls for the four quadrants
      generateStep(x, y, half, offset / 2);
      generateStep(x + half, y, half, offset / 2);
      generateStep(x, y + half, half, offset / 2);
      generateStep(x + half, y + half, half, offset / 2);
    };

    generateStep(0, 0, maxSize, currentTerrainIntensity * 100);
    return newMaze;
  };

  // Generate a maze using Prim's algorithm
  const generatePrimsMaze = () => {
    const newMaze = initializeMaze(true);
    const walls: Cell[] = [];
    
    // Start with the top-left cell
    newMaze[0][0].isWall = false;
    
    // Add walls around the starting cell
    if (width > 2) walls.push(newMaze[0][2]);
    if (height > 2) walls.push(newMaze[2][0]);

    while (walls.length > 0) {
      const randomIndex = Math.floor(Math.random() * walls.length);
      const wall = walls[randomIndex];
      walls.splice(randomIndex, 1);

      const neighbors = getUnvisitedNeighbors(wall, newMaze, 2);
      if (neighbors.length > 0) {
        const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        wall.isWall = false;
        neighbor.isWall = false;

        // Connect the cells
        const dx = neighbor.x - wall.x;
        const dy = neighbor.y - wall.y;
        newMaze[wall.y + dy/2][wall.x + dx/2].isWall = false;

        // Add new walls
        for (const dir of [{x:0,y:-2}, {x:2,y:0}, {x:0,y:2}, {x:-2,y:0}]) {
          const newX = neighbor.x + dir.x;
          const newY = neighbor.y + dir.y;
          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            const newWall = newMaze[newY][newX];
            if (newWall.isWall && !walls.includes(newWall)) {
              walls.push(newWall);
            }
          }
        }
      }
    }

    return newMaze;
  };
  
  // Make sure there is a path from start to any point in the maze
  const makePathPossible = (maze: Cell[][]) => {
    // Create a visited matrix
    const visited: boolean[][] = Array(height).fill(false).map(() => Array(width).fill(false));
    const queue: [number, number][] = [[0, 0]];
    visited[0][0] = true;

    // BFS to find all reachable cells
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (newX >= 0 && newX < width && newY >= 0 && newY < height &&
            !visited[newY][newX] && !maze[newY][newX].isWall) {
          visited[newY][newX] = true;
          queue.push([newX, newY]);
        }
      }
    }

    // Create a path from (0,0) to all unreachable areas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!visited[y][x] && !maze[y][x].isWall) {
          // Find a path to this isolated cell
          let cx = x, cy = y;
          while (!visited[cy][cx]) {
            // Try to connect to an adjacent visited cell
            let connected = false;
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            
            for (const [dx, dy] of directions) {
              const nx = cx + dx;
              const ny = cy + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && visited[ny][nx]) {
                // Connect to this cell
                maze[cy][cx].isWall = false;
                visited[cy][cx] = true;
                connected = true;
                break;
              }
            }
            
            if (!connected) {
              // Move toward 0,0
              if (cx > 0) cx--;
              else if (cy > 0) cy--;
              maze[cy][cx].isWall = false;
            }
          }
        }
      }
    }
  };

  const generateMaze = () => {
    // Get current values from form inputs
    const currentWidth = parseInt(widthInput) || width;
    const currentHeight = parseInt(heightInput) || height;
    const currentWallDensity = parseFloat(wallDensityInput) || wallDensity;
    const currentTerrainIntensity = parseFloat(terrainIntensityInput) || terrainIntensity;
    
    let newMaze: Cell[][];
    
    // Choose maze generation algorithm based on selected option
    switch (mazeAlgorithm) {
      case 'recursive-backtracking':
        newMaze = generateRecursiveBacktrackingMaze();
        break;
      case 'prims':
        newMaze = generatePrimsMaze();
        break;
      case 'none':
      default:
        // Generate a random maze with walls
        newMaze = initializeMaze();
        for (let y = 0; y < currentHeight; y++) {
          for (let x = 0; x < currentWidth; x++) {
            if (Math.random() < currentWallDensity) {
              newMaze[y][x].isWall = true;
            }
          }
        }
    }
    
    // Apply terrain to the maze
    newMaze = generateTerrain(newMaze);
    
    // Make sure a path exists through the maze
    makePathPossible(newMaze);

    const newRobots: Robot[] = [];
    const usedPositions = new Set<string>();

    for (let i = 0; i < robotCount; i++) {
      const pos = findRandomEmptyCell(newMaze, usedPositions);
      usedPositions.add(`${pos.x},${pos.y}`);
      
      newRobots.push({
        id: i,
        x: pos.x,
        y: pos.y,
        isIt: i === 0,
        path: [],
        pathIndex: 0,
        color: colors[i % colors.length],
        lastTagTime: 0,
        status: 'Active',
        movements: [] // Initialize with empty movements array
      });
    }

    setMaze(newMaze);
    setRobots(newRobots);
    setLastTagLocation(null);
    setIsAnimating(false);
    setContinuousPlay(false);
    setExpandedRobot(null);
  };
  
  // Initialize game on mount only
  useEffect(() => {
    generateMaze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isWall) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell) => {
    // Use diagonal distance for 8-directional movement
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.SQRT2 * Math.min(dx, dy) + Math.abs(dx - dy);
  };



  const findPath = useCallback((start: { x: number; y: number }, goal: { x: number; y: number }) => {
    const startCell = maze[start.y][start.x];
    const goalCell = maze[goal.y][goal.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    // Reset cell values for pathfinding
    maze.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
    }));

    while (openSet.length > 0) {
      // Find the node with the lowest f score
      let current = openSet[0];
      let currentIndex = 0;

      openSet.forEach((cell, index) => {
        if (cell.f < current.f) {
          current = cell;
          currentIndex = index;
        }
      });

      // If we reached the goal, reconstruct and return the path
      if (current === goalCell) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.push(temp);
          temp = temp.parent;
        }
        return path.reverse();
      }

      // Move current from openSet to closedSet
      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      // Check all neighbors
      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor)) continue;

        // Check if this is a diagonal move
        const isDiagonal = Math.abs(neighbor.x - current.x) === 1 && Math.abs(neighbor.y - current.y) === 1;
        const movementCost = isDiagonal ? Math.SQRT2 : 1;
        
        // Calculate elevation difference cost
        const elevationDiff = Math.abs(neighbor.elevation - current.elevation);
        const elevationCost = elevationDiff * 0.1; // Make elevation differences matter
        
        // Total cost is base movement cost plus elevation cost
        const totalCost = movementCost + elevationCost;
        
        const tentativeG = current.g + totalCost;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, goalCell);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return [];
  }, [maze, width, height]);

  // Update paths for all robots
  const updatePaths = useCallback(() => {
    const newMaze = [...maze];
    const newRobots = [...robots];

    // Clear all existing paths from maze
    newMaze.forEach(row => row.forEach(cell => {
      cell.robotPaths = [];
    }));

    // Find path for "it" robot first
    const itRobot = newRobots.find(r => r.isIt);
    if (!itRobot) return;

    const nonItRobots = newRobots.filter(r => !r.isIt);
    if (nonItRobots.length === 0) return;

    // Find closest target for "it" robot
    let closestTarget = nonItRobots[0];
    let shortestDistance = Infinity;
    let shortestPath: Cell[] = [];

    for (const target of nonItRobots) {
      const path = findPath(
        { x: itRobot.x, y: itRobot.y },
        { x: target.x, y: target.y }
      );
      
      if (path.length > 0 && path.length < shortestDistance) {
        shortestDistance = path.length;
        shortestPath = path;
        closestTarget = target;
      }
    }

    if (shortestPath.length > 0) {
      itRobot.path = shortestPath;
      itRobot.pathIndex = 0;
      itRobot.status = `Chasing ${closestTarget.color} robot`;

      // Mark path on maze
      shortestPath.forEach(cell => {
        newMaze[cell.y][cell.x].robotPaths.push({
          robotId: itRobot.id,
          color: itRobot.color
        });
      });
    }

    // Calculate escape paths for other robots independently
    nonItRobots.forEach(robot => {
      // Find furthest point from "it" robot
      let bestDistance = -1;
      let bestPath: Cell[] = [];

      // Try multiple random points to find a good escape route
      for (let i = 0; i < 10; i++) {
        const targetPos = findRandomEmptyCell(maze, new Set());
        const distanceToIt = Math.abs(targetPos.x - itRobot.x) + Math.abs(targetPos.y - itRobot.y);
        
        if (distanceToIt > bestDistance) {
          const path = findPath(
            { x: robot.x, y: robot.y },
            targetPos
          );
          
          if (path.length > 0) {
            bestDistance = distanceToIt;
            bestPath = path;
          }
        }
      }

      if (bestPath.length > 0) {
        robot.path = bestPath;
        robot.pathIndex = 0;
        robot.status = 'Escaping';

        // Mark path on maze with distinct color for each robot
        bestPath.forEach(cell => {
          newMaze[cell.y][cell.x].robotPaths.push({
            robotId: robot.id,
            color: robot.color
          });
        });
      }
    });

    setMaze(newMaze);
    setRobots(newRobots);
  }, [robots, maze, findPath]);

  const handleCellClick = (x: number, y: number) => {
    if (!editMode) return;

    const newMaze = [...maze];
    newMaze[y][x].isWall = !newMaze[y][x].isWall;
    setMaze(newMaze);

    const robotOnCell = robots.find(r => r.x === x && r.y === y);
    if (robotOnCell) {
      const usedPositions = new Set(robots.map(r => `${r.x},${r.y}`));
      const newPos = findRandomEmptyCell(newMaze, usedPositions);
      const newRobots = robots.map(r => 
        r.id === robotOnCell.id 
          ? { ...r, x: newPos.x, y: newPos.y }
          : r
      );
      setRobots(newRobots);
    }

    updatePaths();
  };

  // Update paths when animation starts
  useEffect(() => {
    if (isAnimating || continuousPlay) {
      updatePaths();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, continuousPlay]);
  
  // Animation loop
  useEffect(() => {
    if (!isAnimating && !continuousPlay) return;
    
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = UNIVERSAL_CLOCK * moveSpeed;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;

        const newRobots = [...robots];
        
        // Move all robots simultaneously
        newRobots.forEach(robot => {
          if (robot.path.length > robot.pathIndex) {
            const nextCell = robot.path[robot.pathIndex];
            const prevPos = { x: robot.x, y: robot.y };
            
            robot.x = nextCell.x;
            robot.y = nextCell.y;
            robot.pathIndex++;

            // Add movement to this robot's movement history
            const movement: Movement = {
              robotId: robot.id,
              from: prevPos,
              to: { x: nextCell.x, y: nextCell.y },
              type: 'move',
              timestamp: Date.now()
            };
            
            // Update this robot's movement history
            robot.movements = [movement, ...robot.movements.slice(0, MAX_MOVEMENTS - 1)];
          }
        });

        // Check for tags after all robots have moved
        const it = newRobots.find(r => r.isIt);
        if (it) {
          const now = Date.now();
          
          if (now - it.lastTagTime >= TAG_COOLDOWN) {
            newRobots.forEach(robot => {
              if (!robot.isIt && Math.abs(robot.x - it.x) <= 1 && Math.abs(robot.y - it.y) <= 1) {
                setLastTagLocation({ x: robot.x, y: robot.y });
                robot.isIt = true;
                it.isIt = false;
                robot.lastTagTime = now;
                
                // Teleport the previous "it" robot to a random location to prevent tag-backs
                const usedPositions = new Set(newRobots.map(r => `${r.x},${r.y}`));
                const teleportPos = findRandomEmptyCell(maze, usedPositions);
                const originalPos = { x: it.x, y: it.y }; // Store original position
                
                // Update position
                it.x = teleportPos.x;
                it.y = teleportPos.y;
                
                // Add teleport to movement log
                const teleportMovement: Movement = {
                  robotId: it.id,
                  from: originalPos,
                  to: { x: teleportPos.x, y: teleportPos.y },
                  type: 'move', // Using move type to show the teleport as a special movement
                  timestamp: now
                };
                
                // Add the teleport to the movement history
                it.movements = [teleportMovement, ...it.movements.slice(0, MAX_MOVEMENTS - 1)];

                // Add tag event to both robots' movement history
                const tagMovement: Movement = {
                  robotId: robot.id,
                  from: { x: robot.x, y: robot.y },
                  to: { x: robot.x, y: robot.y },
                  type: 'tag',
                  timestamp: now
                };
                
                robot.movements = [tagMovement, ...robot.movements.slice(0, MAX_MOVEMENTS - 1)];
                
                // Also log the tag in the previous "it" robot's history
                const taggedMovement: Movement = {
                  robotId: it.id,
                  from: { x: it.x, y: it.y },
                  to: { x: it.x, y: it.y },
                  type: 'tag',
                  timestamp: now
                };
                
                it.movements = [taggedMovement, ...it.movements.slice(0, MAX_MOVEMENTS - 1)];
              }
            });
          }
        }

        // Update robots in one batch
        setRobots(newRobots);

        // Always update paths after each cycle (like in FollowMe)
        // This ensures all robots continuously redraw their paths
        // Using setTimeout to avoid immediate state updates which can cause infinite loops
        setTimeout(() => {
          updatePaths();
        }, 0);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    lastFrameTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, continuousPlay, robots, maze, moveSpeed, updatePaths]);

  // Toggle expanded robot view for movement logs
  const toggleExpandRobot = (robotId: number) => {
    if (expandedRobot === robotId) {
      setExpandedRobot(null);
    } else {
      setExpandedRobot(robotId);
    }
  };

  // Apply maze settings and generate new maze
  const applySettings = () => {
    // Clear the existing maze and robots first
    setMaze([]);
    setRobots([]);
    
    // Regenerate maze with new settings on next tick
    setTimeout(() => {
      generateMaze();
    }, 0);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 space-y-4">
        {/* Maze controls */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-3">Maze Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Width
              </label>
              <input
                type="number"
                className="w-full rounded border p-1 text-sm"
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                min="5"
                max="40"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Height
              </label>
              <input
                type="number"
                className="w-full rounded border p-1 text-sm"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                min="5"
                max="30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Wall Density ({(parseFloat(wallDensityInput) * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                className="w-full"
                min="0.1"
                max="0.6"
                step="0.05"
                value={wallDensityInput}
                onChange={(e) => setWallDensityInput(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Terrain Intensity ({(parseFloat(terrainIntensityInput) * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                className="w-full"
                min="0.1"
                max="1.0"
                step="0.1"
                value={terrainIntensityInput}
                onChange={(e) => setTerrainIntensityInput(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Maze Algorithm
              </label>
              <select
                className="w-full rounded border p-1 text-sm"
                value={mazeAlgorithm}
                onChange={(e) => setMazeAlgorithm(e.target.value as MazeAlgorithm)}
              >
                <option value="none">Random Walls</option>
                <option value="recursive-backtracking">Recursive Backtracking</option>
                <option value="prims">Prim's Algorithm</option>
              </select>
            </div>
            
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              onClick={applySettings}
            >
              Generate New Maze
            </button>
          </div>
        </div>
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-4 rounded-lg shadow-md ${
              robot.isIt ? 'border-2 border-red-500' : ''
            }`}
          >
            <div 
              className="flex items-center gap-2 mb-2 cursor-pointer"
              onClick={() => toggleExpandRobot(robot.id)}
            >
              <Bot className={`w-5 h-5 ${
                robot.color === 'blue' ? 'text-blue-500' :
                robot.color === 'red' ? 'text-red-500' :
                robot.color === 'green' ? 'text-green-500' :
                robot.color === 'purple' ? 'text-purple-500' :
                robot.color === 'orange' ? 'text-orange-500' :
                'text-blue-500'
              }`} />
              <span className="font-medium">
                Robot {robot.id + 1} {robot.isIt ? "(IT)" : ""}
              </span>
              {expandedRobot === robot.id ? 
                <span className="ml-auto text-xs text-gray-400">▲</span> :
                <span className="ml-auto text-xs text-gray-400">▼</span>
              }
            </div>
            <div className="text-sm">
              Position: ({robot.x}, {robot.y})
            </div>
            <div className="text-sm">
              Status: {robot.status}
            </div>
            
            {expandedRobot === robot.id && (
              <div className="mt-3 border-t pt-2">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FastForward className="w-4 h-4 text-blue-500" />
                  Movement Log
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto pl-1">
                  {robot.movements.length > 0 ? (
                    robot.movements.map((movement, index) => (
                      <div key={index} className="text-xs flex items-center gap-1 text-gray-600">
                        {movement.type === 'tag' ? (
                          <span className="text-red-500 font-medium">Tagged!</span>
                        ) : (
                          <>
                            {/* Check for teleport (significant distance change) */}
                            {Math.abs(movement.from.x - movement.to.x) > 2 || 
                             Math.abs(movement.from.y - movement.to.y) > 2 ? (
                              <>
                                <span>({movement.from.x}, {movement.from.y})</span>
                                <span className="text-purple-500 font-medium px-1">Teleported</span>
                                <span>({movement.to.x}, {movement.to.y})</span>
                              </>
                            ) : (
                              <>
                                <span>({movement.from.x}, {movement.from.y})</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>({movement.to.x}, {movement.to.y})</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No movements yet</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={generateMaze}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
          <button
            onClick={() => {
              if (continuousPlay) {
                setContinuousPlay(false);
                setIsAnimating(false);
              } else {
                setContinuousPlay(true);
              }
            }}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              continuousPlay
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {continuousPlay ? 
              <><span className="mr-1">Stop</span> Continuous Play</> : 
              <><span className="mr-1">Start</span> Continuous Play</>
            }
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-gray-600">{moveSpeed.toFixed(1)}s</span>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={moveSpeed}
              onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
            <button className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded">
              <FastForward className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-2"
          >
            <Hammer className="w-4 h-4" />
            Edit Walls
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="grid grid-cols-1">
            <div 
              className="grid" 
              style={{
                gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
                gap: '2px'
              }}
            >
              {maze.map(row => row.map(cell => {
                const robot = robots.find(r => r.x === cell.x && r.y === cell.y);
                const isTagLocation = lastTagLocation && 
                  lastTagLocation.x === cell.x && 
                  lastTagLocation.y === cell.y;
                
                // Determine cell display based on type
                let cellClass;
                
                if (cell.isWall) {
                  // Wall cells are dark
                  cellClass = 'bg-gray-800';
                } else if (cell.robotPaths.length > 0) {
                  // Path cells are colored based on which robot's path it is
                  const pathRobot = cell.robotPaths[0];
                  // Explicitly define all possible path colors to ensure Tailwind generates them
                  if (pathRobot.color === 'blue') {
                    cellClass = 'bg-blue-100';
                  } else if (pathRobot.color === 'red') {
                    cellClass = 'bg-red-100';
                  } else if (pathRobot.color === 'green') {
                    cellClass = 'bg-green-100';
                  } else if (pathRobot.color === 'purple') {
                    cellClass = 'bg-purple-100';
                  } else if (pathRobot.color === 'orange') {
                    cellClass = 'bg-orange-100';
                  } else {
                    cellClass = 'bg-blue-100'; // Default fallback
                  }
                } else {
                  // Empty cells show terrain elevation
                  const elevation = cell.elevation;
                  // Create a gradient from light green (low) to dark green (high)
                  if (elevation < 30) {
                    cellClass = 'bg-green-50';
                  } else if (elevation < 50) {
                    cellClass = 'bg-green-100';
                  } else if (elevation < 70) {
                    cellClass = 'bg-green-200';
                  } else if (elevation < 85) {
                    cellClass = 'bg-green-300';
                  } else {
                    cellClass = 'bg-green-400';
                  }
                }
                
                // Tag location cells have pink background
                if (isTagLocation && !robot) {
                  cellClass = 'bg-red-100';
                }
                
                return (
                  <div
                    key={`${cell.x},${cell.y}`}
                    className={`aspect-square flex items-center justify-center relative ${cellClass} ${
                      editMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
                    }`}
                    onClick={() => handleCellClick(cell.x, cell.y)}
                  >
                    {robot && (
                      <Bot 
                        className={`w-5 h-5 ${
                          robot.color === 'blue' ? 'text-blue-500' :
                          robot.color === 'red' ? 'text-red-500' :
                          robot.color === 'green' ? 'text-green-500' :
                          robot.color === 'purple' ? 'text-purple-500' :
                          robot.color === 'orange' ? 'text-orange-500' :
                          'text-blue-500'
                        } ${robot.isIt ? 'animate-pulse' : ''}`}
                      />
                    )}
                    {isTagLocation && !robot && (
                      <span className="text-red-500 text-xs font-bold">TAG!</span>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Legend
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-800 rounded"></div>
                <span>Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <span>"It" Robot</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded"></div>
                <span>Blue Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded"></div>
                <span>Red Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded"></div>
                <span>Green Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded"></div>
                <span>Purple Path</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">TAG!</span>
                </div>
                <span>Tag Location</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-purple-500 text-xs font-medium">Teleport</span>
                </div>
                <span>Teleportation (after tag)</span>
              </div>

              <div className="col-span-2 mt-4 mb-2">
                <h4 className="text-sm font-medium">Terrain Elevation</h4>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-50 rounded"></div>
                <span>Very Low (Easy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-200 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-300 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-400 rounded"></div>
                <span>Very High (Difficult)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagGame;