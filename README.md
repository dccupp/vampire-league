# Vampire League — Frontend

React frontend for Vampire League Fantasy Football, a private league 
management app built around a custom ruleset where one manager 
(the Vampire) has special powers to steal players from opponents.

🌐 **Live Demo:** [vampireleaguefootball.com](http://vampireleaguefootball.com)

> **Backend API:** [vamp_api_laravel](https://github.com/dccupp/vamp_api_laravel) 
> — Built with Laravel, deployed on DigitalOcean

## Tech Stack

- **React 18** with TypeScript
- **React Router 6** for client-side routing
- **Axios** for API communication
- **React Hook Form + Yup** for form validation
- **React DnD** for drag-and-drop roster management
- **React Bootstrap / Bootstrap 5** for UI components
- **Sentry** for error tracking
- **Create React App** (Webpack-based build)

## Prerequisites

- Node.js 16+
- The [vamp_api_laravel](https://github.com/dccupp/vamp_api_laravel) 
  backend running locally on port 8080

## Getting Started

```bash
npm install
npm start
```

The dev server proxies `/api` requests to `http://localhost:8080`.

## Environment Variables

| Variable | Development | Production |
|---|---|---|
| `REACT_APP_API_URL` | `/api/` | `https://api.vampireleaguefootball.com/api/` |
| `REACT_APP_TEST_MODE` | `true` | `true` |
| `REACT_APP_TEST_YEAR` | `2025` | `2025` |

## Project Structure

src/
├── api/                          # Service layer
│   ├── leagueService.ts          # League creation (multi-step)
│   ├── seasonService.js          # NFL schedule & fantasy week logic
│   └── calculateFantasyScores.ts # Score computation
├── Components/
│   ├── Login/                    # Authentication
│   ├── Registration/
│   ├── PrivateRoute/             # Route guard HOC
│   ├── Dashboard/                # Main league view
│   ├── RosterComponent/          # Player roster management
│   ├── MatchupComponent/         # Weekly matchup view
│   ├── WaiversComponent/         # Waiver wire
│   ├── ActivityFeedPage/         # League transaction history
│   ├── LandingComponent/         # League selector
│   ├── CreateLeague/             # Multi-step league creation wizard
│   ├── LMToolsComponents/        # Commissioner-only tools
│   ├── LeagueComponents/         # Scoring/roster/waiver rule displays
│   ├── DemoInfoModal/            # Contextual info modal for demo league
│   └── Navbar/
├── constants/
│   └── demoConstants.ts          # Demo league name and time overrides
├── context/
│   └── NowContext.tsx            # Timestamp provider (supports frozen demo time)
├── types.ts                      # Shared TypeScript interfaces
└── api.js                        # Axios instance

## Key Features

- **Multi-step league creation** — wizard flow covering roster rules, 
  scoring rules, and waiver settings
- **Vampire roster type** — separate lineup configuration and elevated 
  FAAB budget for the Vampire manager
- **Waiver system** — FAAB bidding, claim processing, and active claim 
  tracking
- **Commissioner tools** — league activation, member management, and 
  direct player assignment
- **Demo mode** — fixed timestamps and a demo league for showcasing 
  the app without live data
- **Activity feed** — audit trail of all league transactions

## Available Scripts

```bash
npm start        # Start dev server
npm run build    # Production build
npm test         # Run test suite
```

## Notes

- Several components (`OfferTradeComponent`, `WaiverClaimPriorityFormComponent`) 
  exist in the repo but are not currently wired into the app