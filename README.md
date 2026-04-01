# BunnyCrap

BunnyCrap is a bunny-mounted adaptation of the sibling `StarCraft` browser game in this workspace.

The goal for this repo is simple:

- Keep the gameplay structure, controls, maps, units, buildings, UI, hotkeys, and campaign/test levels aligned with the StarCraft version
- Add a BunnyCrap layer on top so units ride bunny mounts without changing the core feel

## Run It

```bash
cd /Volumes/Dev/repos/GitHub/TFFHRTP/BunnyCrap
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Current Direction

- The imported game structure matches the sibling StarCraft repo closely
- Bunny mounts are rendered beneath ground units in the shared draw path
- Further BunnyCrap polish can happen as targeted visual overrides without rewriting the original game logic

## Main Code Areas

- `index.html`: game shell and script loading
- `GameRule/Game.js`: startup, rendering, layer switching, and the BunnyCrap mount rendering hook
- `Characters/`: units, buildings, bullets, effects, maps, upgrades, and buttons
- `Controller/`: mouse and keyboard input
- `css/`, `img/`, `bgm/`: imported UI, sprites, maps, and sounds
