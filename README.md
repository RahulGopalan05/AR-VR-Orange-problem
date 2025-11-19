# AR/VR Campus Viewer - README

## Project Overview
An interactive 3D model viewer built with Three.js that supports both first-person and third-person navigation with physics simulation and collision detection.

**Project Details:**
- **Name:** Rahul Gopalan
- **SRN:** PES1UG23CS462

**About the Model:**
The 3D model featured in this application is a custom-built replica of the **Opera House**, an auditorium located on the PES University campus. The model was designed and created specifically for this project to showcase realistic architectural visualization in an interactive WebGL environment.

## Features
- **Dual View Modes:** Switch between first-person and third-person perspectives
- **Physics System:** Toggle-able gravity 
- **Interactive Elements:** Animated door that can be opened/closed
- **Enhanced Lighting:** Realistic lighting with shadows and multiple light sources
- **Real-time Controls:** WASD movement, mouse look, sprint, and jump mechanics
- **Performance Monitoring:** Built-in FPS counter and position tracking

## File Structure
```
project/
│
├── index.html          # Main HTML file with UI and styling
├── main.js             # Core Three.js application logic
└── arvr5.glb          # 3D campus model (GLTF format)
```

### File Descriptions

**index.html**
- Contains the UI layout and styling
- Control panels for view modes, physics settings, and interactions
- Information display for camera position and FPS
- Import map configuration for Three.js modules

**main.js**
- Three.js scene setup and rendering
- Camera and lighting configuration
- Physics engine with gravity and collision detection
- First-person (PointerLockControls) and third-person (OrbitControls) camera systems
- Door animation logic
- Keyboard and mouse input handling
- Model loading and collision mesh generation

## How to Run

1. **Place all files in the same directory:**
   - `index.html`
   - `main.js`
   - `arvr5.glb`

2. **Start a local HTTP server:**
   ```bash
   python -m http.server 8000
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:8000`
   - The application will load automatically

## Controls

### Third-Person View (Default)
- **Left Click + Drag:** Rotate camera
- **Right Click + Drag:** Pan camera
- **Scroll Wheel:** Zoom in/out

### First-Person View
- **W/A/S/D:** Move forward/left/backward/right
- **Mouse:** Look around (click to lock cursor)
- **Shift:** Sprint
- **Space:** Jump (with gravity) / Fly up (without gravity)
- **↑/↓ Arrow Keys:** Fly up/down (no gravity mode only)
- **E:** Open/close door

### UI Buttons
- **View Mode:** Toggle between first-person and third-person
- **Toggle Gravity:** Enable/disable gravity physics
- **Toggle Door:** Open/close the interactive door
- **Reset Camera:** Return to default camera position

## Important Note for First-Person Mode

⚠️ **Workaround for First-Person Navigation:**

Due to the initial camera spawn position, follow these steps when switching to first-person view:

1. Switch to **First-Person View**
2. **Disable Gravity** (button will turn blue)
3. Use arrow keys (↑) or Space to **fly into the model**
4. Navigate to desired location inside the building
5. **Enable Gravity** again to activate normal walking mechanics
6. You can now move around normally with collision detection

This ensures you start inside the navigable area of the model rather than outside collision boundaries.

⚠️ Menu Interaction Note:
After clicking any menu button, click back on the 3D scene to resume first-person controls. This is necessary to re-lock the cursor and continue movement.

## Technical Details

- **Renderer:** WebGL with shadow mapping and tone mapping
- **Physics:** Custom gravity system (9.8 m/s²) with ground detection
- **Collision System:** Raycaster-based collision detection with multiple meshes
- **Lighting:** Ambient, directional, hemisphere, and point lights with shadows
- **Performance:** Target 60 FPS with dynamic rendering

## Browser Requirements
- Modern browser with WebGL support
- JavaScript enabled
- Recommended: Chrome, Firefox, or Edge (latest versions)
- This project has been tested and verified on the Brave browser
