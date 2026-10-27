# QuestBoard

QuestBoard is a campus RPG where students post small real-life quests, help each other, earn XP, level up, and climb a leaderboard. It uses basic HTML, CSS, Bootstrap, browser JavaScript, Express, and MongoDB.

## Features

- Create a Coder, Designer, or Thinker hero and remember the selected hero in `localStorage`.
- Post, search, filter, accept, edit, complete, and delete campus quests.
- Earn XP when completing a quest; level up every 100 XP.
- View your rank, progress bar, quest history, and the top ten heroes.
- Use the Random Quest button to jump to an open quest.
- Use the responsive dark neon interface on desktop or phone.

## Technology

- Frontend: HTML, CSS, Bootstrap 5, vanilla JavaScript, DOM events, `fetch()`, and `localStorage`.
- Backend: Node.js, CommonJS, Express, and CORS.
- Database: MongoDB official Node.js driver.
- API testing: Postman.

## Run the project

1. Install and start MongoDB locally. QuestBoard connects to `mongodb://127.0.0.1:27017`.
2. Open a terminal in the server folder and install the dependencies:

   ```sh
   cd questboard/server
   npm install
   ```

3. Start the server:

   ```sh
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in a browser.

The server connects to the `QuestBoardDB` database. MongoDB stores heroes in the `heroes` collection and quests in the `quests` collection. MongoDB creates each collection when the first document is saved.

## Game rules

| Difficulty | XP |
| --- | ---: |
| Easy | 20 |
| Medium | 50 |
| Hard | 100 |
| Legendary | 200 |

Level is calculated as `Math.floor(xp / 100) + 1`. Rank titles are Noob (levels 1–2), Apprentice (3–4), Wizard (5–6), and Legend (7+). Quests move from Open to Active to Done. The hero who accepted a quest receives its reward when they complete it.

## API

All endpoints are served from `http://localhost:3000`. Send JSON bodies with `Content-Type: application/json`.

| Method | Endpoint | Purpose / body |
| --- | --- | --- |
| GET | `/api/status` | Check that the API is running. |
| GET | `/api/quests?difficulty=Hard&status=Open` | List quests; difficulty and status filters are optional. |
| POST | `/api/quests` | Create: `{ "title", "description", "difficulty", "postedBy" }`. Reward and status are set by the server. |
| PUT | `/api/quests/:id` | Edit: `action: "edit"` plus poster and fields; accept: `action: "accept", acceptedBy`; complete: `action: "complete", heroId`. |
| DELETE | `/api/quests/:id` | Delete: `{ "postedBy": "hero ID" }`; must match the poster. |
| GET | `/api/heroes` | List heroes. |
| POST | `/api/heroes` | Create: `{ "name", "heroClass", "avatar" }`. XP starts at 0 and level at 1. |
| GET | `/api/heroes/:id` | Get one hero by MongoDB ID. |
| PUT | `/api/heroes/:id` | Add XP: `{ "xpToAdd": 50 }`; the server recalculates level. |
| GET | `/api/leaderboard` | List up to ten heroes, highest XP first. |

Successful reads and updates return `200`; new heroes and quests return `201`. Invalid requests return `400`, missing records return `404`, and server/database errors return `500`.

## Screenshots

Add screenshots to a `screenshots/` folder and replace these placeholders:

![Landing page screenshot](screenshots/landing-page.png)

![Quest board screenshot](screenshots/quest-board.png)

![Leaderboard screenshot](screenshots/leaderboard.png)

![Hero profile screenshot](screenshots/hero-profile.png)

## Project structure

```text
client/                 HTML pages, CSS theme, and browser JavaScript
  css/                  Shared theme and page styles
  js/                   API helpers, shared helpers, and page scripts
server/                 Express server and MongoDB connection
  routes/               Quest, hero, and leaderboard endpoints
```
