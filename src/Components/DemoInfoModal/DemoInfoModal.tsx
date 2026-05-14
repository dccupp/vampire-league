import { useState, useEffect } from 'react';
import { CurrentLeague } from '../../types';
import { DEMO_LEAGUE_NAME } from '../../constants/demoConstants';
import './DemoInfoModal.css';

export type DemoContext =
  | 'Login'
  | 'ActivityFeedPage'
  | 'Dashboard'
  | 'RosterComponent'
  | 'MatchupComponent'
  | 'WaiversComponent';

type BodyItem = { type: 'p' | 'h4'; text: string };

interface DemoContent {
  title: string;
  body: BodyItem[];
}

const CONTENT: Record<DemoContext, DemoContent> = {
  Login: {
    title: 'What is Vampire League?',
    body: [
      { type: 'p', text: 'Vampire League is a unique and increasingly popular twist on traditional fantasy football that turns one player into a predator — and everyone else into potential prey.' },
      { type: 'h4', text: 'The Setup' },
      { type: 'p', text: 'In a 10-team Vampire League, nine managers participate in the draft as normal. The tenth spot — the Vampire — sits out the draft entirely. While everyone else fills their rosters from the player pool, the Vampire waits. Once the draft concludes, the Vampire builds their roster from whatever players remain undrafted.' },
      { type: 'p', text: "Unlike regular managers, the Vampire enters the season with a significantly larger FAAB (Free Agent Acquisition Budget) than everyone else. While all managers have access to the waiver wire throughout the season, the Vampire's bloated budget gives them a major edge in the bidding war for available players — especially as injuries mount and valuable pickups become scarce." },
      { type: 'h4', text: "The Vampire's Powers" },
      { type: 'p', text: "What makes the Vampire truly dangerous is the ability to steal. If the Vampire wins a matchup, they can take a player directly from their opponent's roster — sending back a player of the same position from their own starting lineup in return. As the season wears on and rosters get thinner, this power becomes increasingly devastating." },
      { type: 'h4', text: 'The Schedule' },
      { type: 'p', text: "The Vampire faces every other team in the league exactly once during the early portion of the regular season. After that, the remaining schedule is stacked against the league's weakest performers — giving the Vampire the best possible path to wins, and therefore the best possible opportunities to raid rosters and build a powerhouse team." },
      { type: 'h4', text: "The Regular Managers' Challenge" },
      { type: 'p', text: "For everyone else, survival is the name of the game. Draft strategy takes on a whole new dimension — do you stack depth to protect against the Vampire's raids, or go all-in on star power and hope to stay out of their crosshairs? Every roster decision carries extra weight knowing your best player could be gone by Tuesday morning." },
      { type: 'h4', text: 'How This App Handles It' },
      { type: 'p', text: 'Vampire League gives the Vampire a completely separate roster configuration — different starting lineup requirements and a significantly larger FAAB budget than regular managers. This ensures the game rules are enforced automatically rather than relying on the commissioner to manage everything manually.' },
    ],
  },
  ActivityFeedPage: {
    title: 'League Activity Feed',
    body: [
      { type: 'p', text: 'Placeholder — describe what the Activity Feed shows in the demo.' },
    ],
  },
  Dashboard: {
    title: 'Dashboard',
    body: [
      { type: 'p', text: 'Placeholder — describe what the Dashboard shows in the demo.' },
    ],
  },
  RosterComponent: {
    title: 'Your Roster',
    body: [
      { type: 'p', text: 'Placeholder — describe what the Roster page shows in the demo.' },
    ],
  },
  MatchupComponent: {
    title: 'Weekly Matchup',
    body: [
      { type: 'p', text: 'Placeholder — describe what the Matchup page shows in the demo.' },
    ],
  },
  WaiversComponent: {
    title: 'Waivers',
    body: [
      { type: 'p', text: 'Placeholder — describe what the Waivers page shows in the demo.' },
    ],
  },
};

interface DemoInfoModalProps {
  currentLeague?: CurrentLeague;
  context: DemoContext;
  variant?: 'floating' | 'link';
}

const DemoInfoModal = ({ currentLeague, context, variant = 'floating' }: DemoInfoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (currentLeague && currentLeague.name !== DEMO_LEAGUE_NAME) return null;

  const { title, body } = CONTENT[context];

  return (
    <>
      {variant === 'link' ? (
        <button className="dim-trigger-link" onClick={() => setIsOpen(true)}>
          What is Vampire League?
        </button>
      ) : (
        <button
          className="dim-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Demo info"
          title="About this demo"
        >
          ⓘ
        </button>
      )}

      {isOpen && (
        <div className="dim-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="dim-modal animate__animated animate__fadeInDown"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dim-title"
          >
            <div className="dim-header">
              <span id="dim-title" className="dim-title">{title}</span>
              <button className="dim-close" onClick={() => setIsOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="dim-body">
              {body.map((item, i) =>
                item.type === 'h4'
                  ? <h4 key={i} className="dim-section-heading">{item.text}</h4>
                  : <p key={i}>{item.text}</p>
              )}
            </div>
            <div className="dim-footer">
              <span className="dim-badge">Demo League</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DemoInfoModal;