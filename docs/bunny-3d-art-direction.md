# BunnyCrap 3D Art Direction

This document translates the reference sheet at `img/Bunny/bunnycrap_char.png` into a consistent 3D character direction for BunnyCrap.

## Overall Style

- Stylized 3D hero units, not realistic rabbits
- Chunky, readable silhouettes at RTS camera distance
- Soft fur volumes with hard-surface armor overlays
- StarCraft-adjacent faction language:
  - Zerg: organic, spined, bio-plated, glowing sacs
  - Terran: industrial, modular, military, orange thrusters
  - Protoss: elegant, ceremonial, smooth gold and luminous energy
  - Neutral/Special: iconic personalities with simpler prop language
- Render target:
  - isometric RTS readability first
  - 3/4 front camera
  - one baked key light, one soft rim light
  - strong ground contact shadow

## Shared Bunny Anatomy Rules

- Head is 30-38% of total body volume
- Ears must stay readable in top-down/isometric view
- Eyes are oversized and emissive when faction-appropriate
- Front paws remain visible unless replaced by vehicle treads or armored gauntlets
- Back silhouette should never collapse into a generic oval; each unit needs a distinctive rear or top profile

## Material Rules

- Fur:
  - broad value separation between face, belly, and back
  - subtle clumping, not noisy hair strands
- Armor:
  - bevel every large panel for highlight readability
  - use 2-3 material groups max per unit
- Emissives:
  - reserved for eyes, engines, psi, sacs, or energy seams
- Dirt:
  - light edge wear only; avoid gritty realism

## Unit Archetypes

### Zerg

`Zergling Bunny`
- Small, feral, hunched rabbit-hyena shape
- Dark brown bio-fur, jagged cheek line, predator grin
- Organic shoulder growths and rib-like side armor
- Fast attack silhouette with aggressive forward lean

`Baneling Bunny`
- Cream bunny with oversized glowing acid sac mounted on back
- Rounded body, cute face, dangerous payload
- Green translucent orb with internal glow and bubbling texture

`Hydralisk Bunny`
- Mid-sized assault bunny with crown of dorsal spines
- Thick brow, plated face, heavy chest
- Organic spear-like back fins and layered carapace

`Mutalisk Bunny`
- Compact dark bunny with leathery wings
- Red eyes, narrow face, low profile body
- Wings should read immediately from above, even folded

`Ultralisk Bunny`
- Large siege beast bunny with broad armored forehead
- Massive plated back and horned front silhouette
- More tank than rabbit in massing, but still clearly bunny-faced

### Terran

`Marine Bunny`
- White rabbit in blue powered infantry armor
- Rounded pauldrons, chest plate, visor or reinforced brow
- Friendly but battle-ready expression

`Marauder Bunny`
- Heavy black/orange armored shock bunny
- Missile pods or grenade racks mounted over shoulders
- Denser and lower than Marine Bunny

`Reaper Bunny`
- Agile black armored bunny with goggles and thruster pack
- Red scarf or red accent reads well
- Lean silhouette with explosive flares behind

`Siege Tank Bunny`
- Bunny integrated into a mini tracked tank chassis
- The whole character is one vehicle-creature hybrid
- Face remains visible; treads and cannon dominate lower half

`Battlecruiser Bunny`
- Bunny integrated into a heavier gold/steel battle platform
- Chunkier than tank variant, more command-vehicle than rider
- Strong front armor wedge and bright engine highlights

### Protoss

`Zealot Bunny`
- Cream rabbit with psi blades extending from both sides
- Clean heroic proportions and luminous teal blades
- Minimal armor, ceremonial harness

`Stalker Bunny`
- Dark stealth-tech bunny with blue visor and orange thrusters
- Mechanical harness replaces much of torso silhouette
- Reads as advanced recon/assassin unit

`High Templar Bunny`
- White rabbit mage in royal blue and gold robes
- Floating energy motes and formal collar/pauldrons
- Face remains soft and wise, not feral

`Archon Bunny`
- Entire unit is an energy rabbit silhouette
- No visible physical fur detail, just luminous cosmic form
- Bright outline and internal nebula-like glow

`Carrier Bunny`
- Bunny integrated into elegant gold starcraft shell
- Blue visor, sleek fins, regal shape language
- Must feel like a living ship-rabbit hybrid

### Neutral / Special

`Xel'Naga Bunny`
- Cosmic rabbit, deep indigo body with starfield emissive pattern
- Smooth mystical silhouette, ancient feeling

`Infested Bunny`
- Corrupted rabbit with red infection nodes and blackened armor
- Asymmetrical growths, hostile expression

`Mercenary Bunny`
- Rugged gray combat rabbit with scavenged military gear
- Green helmet, practical armor, less polished than Terran

`Critter Bunny`
- Clean white rabbit with floral collar and warm personality
- Minimal armor, mascot readability

`Dev Bunny`
- Black bunny in hoodie with glasses
- Comedic special unit; simple readable modern props

## Game Mapping

- `Drone` -> `Baneling Bunny`
- `Zergling`, `Broodling`, `Larva` -> `Zergling Bunny`
- `Hydralisk`, `Lurker`, `Queen`, `Defiler` -> `Hydralisk Bunny`
- `Mutalisk`, `Guardian`, `Devourer`, `Scourge`, `Overlord` -> `Mutalisk Bunny`
- `Ultralisk` -> `Ultralisk Bunny`
- `InfestedTerran` -> `Infested Bunny`
- `Marine`, `Medic`, `SCV`, `Civilian` -> `Marine Bunny`
- `Firebat`, `Goliath` -> `Marauder Bunny`
- `Ghost`, `Vulture`, `Wraith`, `Valkyrie`, `Vessel`, `Dropship` -> `Reaper Bunny`
- `Tank` -> `Siege Tank Bunny`
- `BattleCruiser`, `HeroCruiser` -> `Battlecruiser Bunny`
- `Probe`, `Zealot`, `DarkTemplar` -> `Zealot Bunny`
- `Dragoon`, `Observer`, `Arbiter`, `Corsair`, `Scout` -> `Stalker Bunny`
- `Templar`, `DarkArchon` -> `High Templar Bunny`
- `Archon` -> `Archon Bunny`
- `Carrier`, `Shuttle`, `Reaver` -> `Carrier Bunny`
- `Kakaru` -> `Xel'Naga Bunny`
- `Ragnasaur`, `Rhynsdon`, `Ursadon`, `Bengalaas`, `Scantid` -> `Critter Bunny`
- `Sarah`, `Kerrigan` -> `Dev Bunny`
- fallback -> `Mercenary Bunny`

## Render Requirements

- Render each character on transparent background
- Deliver one idle beauty render and one gameplay render
- Gameplay render camera:
  - 3/4 front
  - slight top-down
  - centered, tightly cropped
- Export:
  - `1024x1024` source render
  - `256x256` gameplay render
  - optional 8-direction turnaround if animating later
