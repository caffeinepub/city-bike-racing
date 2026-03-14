# City Bike Racing Game

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Bike selection menu with 6 bikes, each with unique stats (speed, acceleration, handling)
- 3D third-person racing game set in a city environment
- Race against 5 AI opponents
- Fixed-distance race (finish line at set distance)
- In-game HUD: speedometer, gear indicator, position tracker, pause button
- Gear system: player can manually shift gears up/down
- Brake control
- Pause/resume functionality
- Race result screen (win/lose, position)
- High score tracking (best race time per bike)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: store high scores and race results per bike
2. Frontend game using React Three Fiber:
   - Bike selection menu screen
   - 3D city road environment (procedural or tiled road with buildings)
   - Third-person camera behind player bike
   - Player bike with gear/brake/accelerate controls (arrow keys or WASD + keyboard)
   - 5 AI bikes with varying speeds
   - HUD overlay: speed, gear, race position, distance remaining
   - Pause modal
   - Finish/result screen
3. Mobile-friendly on-screen buttons for controls
