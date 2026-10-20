# Sus at TBS

A school mystery game made for (and with) pauligur. One of the "students" is secretly the mean teacher,
handing out detentions. Do your maintenance tasks, call assemblies, and vote out the teacher.
The Headmistress gives orders and punishments.

## Modes
- **Play alone**: maintenance shift. Finish 8 tasks before the bell and stay away from the three mean teachers: Mr. Cuff, Mr. Jones and Mr. Blount.
- **Play online**: one player creates a room (usually the Headmistress) and shares the 4-letter code; friends
  join with it. The host can add practice bots. One student is secretly picked as the teacher (two with 7+ students).
- **Practice with bots**: try being the Headmistress, a Student, or the Teacher on your own.

## How online works
No server to run: the room creator's browser runs the game, and friends connect to it directly
(peer-to-peer WebRTC, via [PeerJS](https://peerjs.com)). PeerJS's free public service only helps the browsers
find each other. If the host closes their tab, the room ends. Chat works in the lobby and during assemblies
(never while walking around, so nobody can just reveal the teacher). Messages are capped at 80 characters,
swear words (English/Spanish) are starred out, and links, emails and long numbers are blocked. The Headmistress
can mute anyone or switch free chat off (preset phrases only). Nothing is saved. Some school or office Wi-Fi blocks peer-to-peer connections.

## Controls
WASD / arrows to move · mouse to look (click the game first) · **E** use / task / report ·
**Q** detention (teacher) · **F** sabotage (teacher) · **V** staff door (teacher) · **H** Headmistress panel ·
**M** map · **C** first/third-person view · **Esc** pause. On tablets: joystick + drag to look + buttons.

## Run it locally
Any static file server works, for example:

    python3 -m http.server 8000

then open http://localhost:8000.

## Files
- `index.html`, `style.css`: menus and HUD
- `js/world.js`: the campus (layout taken from the 2025 campus map and floor plans)
- `js/gim.js`: Gimkit-style characters and the inventory items (official uniforms, PE, house T-shirts, sports kits)
- `js/sim.js`: game rules, bots, the solo teachers, Headmistress orders
- `js/online.js`: rooms, lobby, and keeping everyone's game in sync
- `js/tasks.js`: mini-games
- `js/i18n.js`: English / Español
- `assets/badge.svg`: the adapted TBS badge

No personal data is collected; nicknames, stars and settings stay in your browser.
