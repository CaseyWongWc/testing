#!/bin/bash
# Script to prepare WSS project submission

# Create a submission directory
mkdir -p WSS_Submission

# Copy source code
echo "Copying source code files..."
cp src/combat/WSSTwo.tsx WSS_Submission/
cp src/combat/Combat.tsx WSS_Submission/ 2>/dev/null || echo "Combat.tsx not found, skipping"
cp src/combat/EmptyClassroom.tsx WSS_Submission/ 2>/dev/null || echo "EmptyClassroom.tsx not found, skipping"
cp src/combat/ZombiesAhh.tsx WSS_Submission/ 2>/dev/null || echo "ZombiesAhh.tsx not found, skipping"
cp src/combat/RogueLikeGame.tsx WSS_Submission/ 2>/dev/null || echo "RogueLikeGame.tsx not found, skipping"
cp src/combat/WSSRogueHDraft.tsx WSS_Submission/ 2>/dev/null || echo "WSSRogueHDraft.tsx not found, skipping"

# Copy report and documentation
echo "Copying documentation files..."
cp WSS_Project_Report.md WSS_Submission/
cp WSS_Demo_Script.md WSS_Submission/
cp WSS_Program_Output.txt WSS_Submission/
cp Project_Overview_Showcase.md WSS_Submission/

# Create a README file
echo "Creating README file..."
cat > WSS_Submission/README.md << EOF
# Wilderness Survival System - Project Submission

## Overview
This submission contains the implementation of a Wilderness Survival System (WSS) as required for the team project.

## Contents
1. **Source Code** - Implementation files for the WSS and related components
2. **Project Report** - Detailed documentation of the implementation and OOP principles
3. **Program Output** - Text representation of program execution
4. **Demo Script** - Guide for creating a video demonstration
5. **Project Overview** - Showcase of all implemented components

## Running the Project
The project is implemented using TypeScript and React. To run it:
1. Ensure Node.js and npm are installed
2. Install dependencies with \`npm install\`
3. Start the development server with \`npm run dev\`

## Main Features
- 5 terrain types (plains, forest, mountain, desert, swamp)
- 4 trader types (generous, fair, greedy, impatient)
- 3 vision types (cautious, eagle, strategic)
- 6 brain types (balanced, explorer, collector, trader, adaptive, strategic)
- Resource management system
- Trading with negotiation
- Path finding and navigation

## Contact
For any questions, please contact Casey Wong.
EOF

# Create zip file
echo "Creating zip file..."
cd WSS_Submission
zip -r ../WSS_Project_Submission.zip *
cd ..

echo "Submission package created: WSS_Project_Submission.zip"
echo "The zip file contains source code, documentation, and program output."