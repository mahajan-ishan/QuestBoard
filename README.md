# QuestBoard

QuestBoard is a campus RPG where students post small real-life quests, help each other, earn XP, level up, and climb a leaderboard. It uses basic HTML, CSS, Bootstrap, browser JavaScript, Express, and MongoDB.

## Features

- **Authentication System**: Secure register, login, logout, and session persistence using tokens (`crypto.randomBytes(24).toString("hex")`) and `localStorage`.
- **Multi-Class Heroes**: Heroes can select any combination of `Coder`, `Designer`, and `Thinker` classes, displayed with colored badges.
- **Quest Lifecycle & Review Flow**:
  - **Open**: Newly posted quests awaiting acceptance.
  - **Active**: Accepted with contact information (visible only to poster and accepter). Accepter can submit for review or give up.
  - **Pending**: Submitted by accepter; poster can **Approve** (awards XP and checks level-up) or **Reject**.
  - **Done**: Completed and rewarded.
- **Level-Up Popup**: Automatically detects when your level increases across page loads and displays a glowing achievement modal.

## Quest Workflow Diagram

```text
 [ Open ] --(Accept with Contact)--> [ Active ] --(Submit for Review)--> [ Pending ]
   ^                                      |                                   |
   |--(Give Up)---------------------------|                 (Approve)---------+--> [ Done ] (+XP)
                                                            (Reject)---------+--> [ Active ]
```

## Technology

- Frontend: HTML, CSS, Bootstrap 5, vanilla JavaScript, DOM events, `fetch()`, and `localStorage`.
- Backend: Node.js, CommonJS, Express, CORS, and built-in `crypto`.
- Database: MongoDB official Node.js driver.
- API testing: Postman.

## Run the project

1. Install and start MongoDB locally (`mongodb://127.0.0.1:27017`).
2. Install server dependencies:
   ```sh
   cd server
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in a browser.

## API Endpoints

All protected endpoints require the header `Authorization: <token>`.

| Method | Endpoint | Purpose / Body |
| --- | --- | --- |
| GET | `/api/status` | Check that the API is running. |
| POST | `/api/auth/register` | Register new hero: `{ username, password, heroClasses, avatar }`. Returns token & hero. |
| POST | `/api/auth/login` | Log in existing hero: `{ username, password }`. Returns token & hero. |
| POST | `/api/auth/logout` | Log out and clear token (requires auth). |
| GET | `/api/auth/me` | Get logged-in hero details (requires auth). |
| GET | `/api/quests` | List quests (supports `?difficulty=...&status=...`). |
| POST | `/api/quests` | Create quest: `{ title, description, difficulty }` (requires auth). |
| PUT | `/api/quests/:id` | Edit quest (poster only, when Open). |
| PUT | `/api/quests/:id/accept` | Accept quest: `{ contact }` (requires auth). |
| PUT | `/api/quests/:id/submit` | Submit quest for review (accepter only). |
| PUT | `/api/quests/:id/approve` | Approve quest and award XP (poster only). |
| PUT | `/api/quests/:id/reject` | Reject quest review (poster only). |
| PUT | `/api/quests/:id/giveup` | Give up active quest (accepter only). |
| DELETE | `/api/quests/:id` | Delete open quest (poster only). |
| GET | `/api/heroes` | List all hero profiles. |
| GET | `/api/heroes/:id` | Get single hero profile. |
| GET | `/api/leaderboard` | List top 10 heroes by XP. |

## Project structure

```text
client/                 HTML pages, CSS theme, and browser JavaScript
  css/                  Shared theme and page styles
  js/                   API wrapper, common helpers, auth, board, profile, leaderboard scripts
server/                 Express server and MongoDB connection
  middleware/           Auth verification middleware (`requireLogin`)
  routes/               Auth, quest, hero, and leaderboard endpoints
```
