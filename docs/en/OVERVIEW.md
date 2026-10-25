# Rừng Săn Hồn Online: English overview

Short English summary for outsiders. The project's working language is **Vietnamese**; all design docs, UI text, commits and PRs are in Vietnamese. When this summary and the Vietnamese docs differ, the Vietnamese docs and the code win.

## What it is

*Rừng Săn Hồn Online* ("Soul Hunting Forest Online") is a browser MMO set in **Đấu La Đại Lục** (*Douluo Dalu*, "Land of Soul Masters"), made as a **non-commercial fan game for a circle of friends**. It has no payments and no stamina system: everything is earned by playing. It is not affiliated with the original authors or publishers. Original names (characters, spirits, places) are used on purpose.

Visuals are pixel art in an **isometric** view (2:1 diamond tiles, 8 facing directions) in the style of Ultima Online, with an ink-wash (thủy mặc) UI. Desktop first; the UI also works with touch (virtual joystick and buttons).

## Gameplay

Terms: *võ hồn* = martial spirit (your "class"/creature), *hồn sư* = soul master (the player avatar), *hồn thú* = soul beast (monster), *hồn hoàn* = soul ring, *hồn cốt* = soul bone, *hồn hạch* = soul core, *hồn kỹ* = soul skill, *niên hạn* = age in years of a ring or beast.

- **Collect martial spirits.** Each player owns several spirits; each levels up separately (levels 1–100, bottlenecks every 10 levels). A **team of 4** (`TEAM_SIZE`) is built from four roles: burst damage, agile damage, control and support. You can swap spirits mid-fight.
- **Hunt soul beasts** across several maps (towns, hunting maps, a boss map) to get soul rings, soul bones and soul cores. Rings have an age up to 100,000 years and must be absorbed within the spirit's limit; absorbing too far can destroy the ring.
- **Elites, beast kings and world bosses** scale in difficulty with the number of players taking part.
- **Party and PvP.** Players form parties and fight bosses together. PvP exists only in the ranked **Đại Đấu Hồn Trường** (Soul Fighting Arena). There is no player trading and no PvP outside the arena, so one person cannot farm for everyone else.
- **Losing costs little.** You never lose a spirit, an absorbed ring, or equipped bones and cores (one explicit exception: high equipment enhancement, only if the player chooses to risk it).
- Also: quests, equipment, sects (tông môn), friends, auto-hunt and offline commissions, a radar / area map.

All balance numbers live in one file, `shared/data.ts`; the docs describe mechanics and point to constant names instead of copying values.

## Architecture

```
client (Phaser 3 + Vite, TypeScript)  <-- WebSocket (Colyseus) -->  server (Node.js + Colyseus, TypeScript)
   renders state, sends intent                                        all game logic  -->  PostgreSQL / Supabase
                 shared/ (data.ts, movement, pathing ...) is imported by server, client and bots
```

- **Server-authoritative.** Game rules run only in Colyseus rooms in `server/src/rooms/`: `MapRoom.ts` (one room type for every map; each room instance is a *channel*) and `ArenaRoom.ts` (arena match, a subclass of `MapRoom`, with a matchmaking queue). The client only renders state and sends *intent* (movement input, attack, skill, pick-up ...). It predicts its own movement; the server decides everything else.
- **State sync.** Public state is a Colyseus schema (`server/src/rooms/schema.ts`), read by `client/src/scenes/GameScene.ts`. Entities are synced only near the player (interest management, `interest.ts`), so the client must not assume far entities exist. A player's private data is sent as private messages, not public state.
- **Maps** are Tiled JSON files in `shared/assets/`, declared in `MAPS` (`shared/data.ts`). The server ticks at 20 Hz (`TICK_RATE`).
- **Persistence.** PostgreSQL or Supabase. The server applies every `server/sql/*.sql` file by name on each start (idempotent, row-level security on, no policies). Without `DATABASE_URL` it keeps data in RAM and loses it on shutdown. Writes for one player are serialized, and map travel saves in a single transaction before the client is told to join the new room.
- **Scaling.** Several server processes can share state through Redis (`RedisPresence`); without `REDIS_URL` everything is in-process.
- **Anti-cheat** follows from the above: the client cannot create items, damage or positions. Test hooks exist only when the server runs with `GAME_TEST=1`.

## Run it locally

Requires Node.js 22+.

```bash
npm run install:all       # install server + client dependencies
npm run dev:server        # terminal 1: server at http://localhost:2567
npm run dev:client        # terminal 2: game at http://localhost:5173
```

Open `http://localhost:5173`, enter any name and password (a new name creates an account), create a character and go through the awakening ceremony. Open a second incognito tab to see two players. Without a database, data is kept in RAM only; for PostgreSQL run `docker compose up -d` and `cp .env.example server/.env`.

Checks: `npm run check` (typechecks, sprite / map / docs validation; required after every change). Bots that play the game and assert rules: `npm run bot:local -- --only <group>` (starts its own `GAME_TEST=1` server on a free port and cleans up).

## Repository and documentation map

| Path | Contents |
|---|---|
| `server/` | Colyseus server, rooms, database layer, SQL migrations |
| `client/` | Phaser client, UI, audio, bot script |
| `shared/` | Code and data used by both sides; `data.ts` holds all balance numbers; `assets/` holds maps and sprites |
| `art/`, `tools/` | Art sources and credits; asset / map / audio / docs tooling |
| `GAME_DESIGN.md` | Entry point: index mapping section numbers to files (code cites sections like "mục 5.3") |
| `docs/design/` | Game rules by system (spirits, rings, bones, cores, maps and beasts, quests, party / arena, sects, equipment ...) |
| `docs/tech/` | Technical docs: state sync, protocol, database, channels, Redis presence, performance |
| `docs/art/` | Art specs, isometric rules, sources and licenses, audio |
| `docs/quyet-dinh.md`, `ROADMAP.md`, `docs/lich-su.md` | Current decisions, roadmap, change history |
| `CLAUDE.md`, `CONTRIBUTING.md` | Code rules and contribution workflow |

Start with `README.md` (setup, in Vietnamese), then `GAME_DESIGN.md`. A player guide is `docs/huong-dan-choi.md`. Reading the design docs in depth requires Vietnamese; machine translation of single files is enough for orientation.

## Assets and licenses (summary)

- Only **free** assets are accepted. Any clearly stated free license is allowed (CC0, CC-BY, CC-BY-SA, OGA-BY, CC-BY-NC, GPL, OFL ...) because the game is non-commercial; assets with no clear license or "all rights reserved" are not. Share-alike and NC obligations are tracked.
- Player and NPC sprites use layers from the **Universal LPC Spritesheet Character Generator**. UI and effects art comes from AI-assisted pixel pipelines, hand editing and code, with pixel post-processing. Sprites or redrawn art from commercial games, anime or comics are never used.
- Sound: CC0 / royalty-free only, no AI audio; background music is composed in code.
- Every external asset has a line in `art/CREDITS.md` (author, source URL, license, file, edits). Attribution for CC-BY / SA assets is shown in the in-game credits screen. Some license-restricted packs live in a separate private asset store; the public repo keeps manifests and credits only. Details: `docs/art/nguon-giay-phep.md`.
- The repository has no top-level `LICENSE` file. Treat the code as all rights reserved unless the owner says otherwise, and ask before reusing it.

## Contributing

All work goes through GitHub issues (`CONTRIBUTING.md`, in Vietnamese). Pick an issue labeled `san-sang` ("ready") with no assignee, claim it (assign yourself, add `dang-lam` = "in progress"), open a draft PR right away with `Closes #N`, and work on a branch from `origin/main`. Rules: one small task per PR, no commits to `main`, no force-push, run `npm run check` before committing, keep UI text, comments, commits and PR descriptions in Vietnamese, put balance numbers only in `shared/data.ts`, and never commit secrets. AI agents work under the same rules (`CLAUDE.md`).
