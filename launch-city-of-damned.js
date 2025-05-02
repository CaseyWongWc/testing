// Simple launcher script for City of the Damned game

console.log("+---------------------------------------------------------+");
console.log("|          City of the Damned - Game Launcher             |");
console.log("+---------------------------------------------------------+");

// Calculate the URL to access the game
const replit_id = process.env.REPL_ID;
const replit_owner = process.env.REPL_OWNER;
const replit_slug = process.env.REPL_SLUG;

let gameUrl;
if (replit_id && replit_owner) {
  // In Replit environment
  gameUrl = `https://${replit_slug}.${replit_owner}.repl.co/?game=cityofdamned`;
  console.log("Running on Replit - your game is available at:");
} else {
  // Local development environment
  gameUrl = "http://localhost:5173/?game=cityofdamned";
  console.log("Running locally - your game is available at:");
}

console.log(`\n${gameUrl}\n`);
console.log("Game Controls:");
console.log("  WASD - Move player");
console.log("  Mouse - Aim");
console.log("  Left Click - Primary weapon");
console.log("  Right Click - Secondary weapon");
console.log("  E - Melee attack");
console.log("  R - Reload");
console.log("  Space - Dodge");
console.log("  Tab - Switch player");
console.log("  ESC - Return control to AI");
console.log("\nOpen the URL in your browser to play the game.");
console.log("+---------------------------------------------------------+");

// Display instructions about the cityresults directory
console.log("\nNotes:");
console.log("- High scores and game results will be saved to the 'cityresults' directory");
console.log("- Make sure the cityresults directory exists before playing");

// Create cityresults directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./cityresults')) {
  console.log("Creating cityresults directory for high scores...");
  fs.mkdirSync('./cityresults');
  console.log("Directory created successfully");
} else {
  console.log("Cityresults directory already exists");
}