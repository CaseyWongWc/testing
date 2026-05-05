{/* Previous code remains the same until the generateTerrain function */}

const getValidNeighbors = (cell: Cell) => {
  const neighbors: Cell[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dx, dy] of directions) {
    const newX = cell.x + dx;
    const newY = cell.y + dy;

    if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
      neighbors.push(terrain[newY][newX]);
    }
  }

  return neighbors;
};

const heuristic = (a: Cell, b: Cell) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const findPath = useCallback((start: Cell, goal: Cell, isCherry: boolean = false) => {
  const openSet: Cell[] = [start];
  const closedSet: Cell[] = [];
  
  terrain.forEach(row => row.forEach(cell => {
    cell.f = 0;
    cell.g = 0;
    cell.h = 0;
    cell.parent = null;
    if (!isCherry) cell.isPath = false;
    else cell.cherryPath = false;
  }));

  while (openSet.length > 0) {
    let current = openSet[0];
    let currentIndex = 0;

    openSet.forEach((cell, index) => {
      if (cell.f < current.f) {
        current = cell;
        currentIndex = index;
      }
    });

    if (current === goal) {
      const path: Cell[] = [];
      let temp = current;
      while (temp.parent) {
        path.push(temp);
        if (isCherry) temp.cherryPath = true;
        else temp.isPath = true;
        temp = temp.parent;
      }
      return path.reverse();
    }

    openSet.splice(currentIndex, 1);
    closedSet.push(current);

    const neighbors = getValidNeighbors(current);

    for (const neighbor of neighbors) {
      if (closedSet.includes(neighbor)) continue;

      const energyCost = neighbor.elevation / 10;
      const tentativeG = current.g + energyCost;

      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue;
      }

      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, goal);
      neighbor.f = neighbor.g + neighbor.h;
    }
  }

  return [];
}, [terrain, width, height]);

const findNearestCherry = useCallback(() => {
  let nearest = null;
  let shortestPath: Cell[] = [];
  let shortestDistance = Infinity;

  terrain.forEach(row => {
    row.forEach(cell => {
      if (cell.hasCherry) {
        const path = findPath(terrain[robotPos.y][robotPos.x], cell, true);
        if (path.length > 0 && path.length < shortestDistance) {
          shortestDistance = path.length;
          shortestPath = path;
          nearest = { x: cell.x, y: cell.y };
        }
      }
    });
  });

  setNearestCherry(nearest);
  setCherryPath(shortestPath);
  return shortestPath;
}, [terrain, robotPos, findPath]);

useEffect(() => {
  let animationFrameId: number;
  
  const animate = (timestamp: number) => {
    if (!isAnimating) return;

    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    accumulatedTimeRef.current += deltaTime;
    const frameTime = moveSpeed * 1000;

    if (accumulatedTimeRef.current >= frameTime) {
      accumulatedTimeRef.current = 0;

      // Handle charging
      if (energy <= 0) {
        setIsCharging(true);
        setEnergy(prev => Math.min(MAX_ENERGY, prev + CHARGE_RATE));
        setMovements(prev => [{
          from: robotPos,
          to: robotPos,
          type: 'charge',
          energyCost: CHARGE_RATE,
          timestamp: Date.now()
        }, ...prev.slice(0, 9)]);
        return;
      }

      if (isCharging && energy < MAX_ENERGY) {
        setEnergy(prev => Math.min(MAX_ENERGY, prev + CHARGE_RATE));
        return;
      }

      if (isCharging && energy >= MAX_ENERGY) {
        setIsCharging(false);
      }

      // Check if we need to find a new path
      if (energy <= ENERGY_THRESHOLD && currentPriority !== 'cherry') {
        setCurrentPriority('cherry');
        const cherryPath = findNearestCherry();
        if (cherryPath.length > 0) {
          setPath(cherryPath);
          setCurrentPathIndex(0);
        }
      }

      // Move along current path
      if (path.length > 0 && currentPathIndex < path.length) {
        const nextCell = path[currentPathIndex];
        const energyCost = nextCell.elevation / 10;

        if (energy >= energyCost) {
          const prevPos = { ...robotPos };
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setEnergy(prev => prev - energyCost);
          setCurrentPathIndex(prev => prev + 1);

          // Check if we collected a cherry
          if (terrain[nextCell.y][nextCell.x].hasCherry) {
            const newTerrain = [...terrain];
            newTerrain[nextCell.y][nextCell.x].hasCherry = false;
            setTerrain(newTerrain);
            setEnergy(MAX_ENERGY);
            setCherriesCollected(prev => prev + 1);
            setCurrentPriority('goal');
          }

          setMovements(prev => [{
            from: prevPos,
            to: { x: nextCell.x, y: nextCell.y },
            type: currentPriority,
            energyCost: energyCost,
            timestamp: Date.now()
          }, ...prev.slice(0, 9)]);
        }
      } else {
        // Find new path
        if (robotPos.x === goalPos.x && robotPos.y === goalPos.y) {
          setGameWon(true);
          setIsAnimating(false);
        } else if (energy <= ENERGY_THRESHOLD) {
          const cherryPath = findNearestCherry();
          if (cherryPath.length > 0) {
            setPath(cherryPath);
            setCurrentPathIndex(0);
          } else {
            const goalPath = findPath(terrain[robotPos.y][robotPos.x], terrain[goalPos.y][goalPos.x]);
            setPath(goalPath);
            setCurrentPathIndex(0);
          }
        } else {
          const goalPath = findPath(terrain[robotPos.y][robotPos.x], terrain[goalPos.y][goalPos.x]);
          setPath(goalPath);
          setCurrentPathIndex(0);
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  if (isAnimating) {
    lastFrameTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
    const startPath = findPath(terrain[robotPos.y][robotPos.x], terrain[goalPos.y][goalPos.x]);
    setPath(startPath);
    setCurrentPathIndex(0);
    animationFrameId = requestAnimationFrame(animate);
  }

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}, [isAnimating, energy, currentPriority, path, currentPathIndex, robotPos, goalPos, terrain, moveSpeed, findPath, findNearestCherry]);

{/* Rest of the component remains the same */}