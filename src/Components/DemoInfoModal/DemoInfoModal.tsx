import { useState, useEffect } from 'react';
import { CurrentLeague } from '../../types';
import { DEMO_LEAGUE_NAME } from '../../constants/demoConstants';
import './DemoInfoModal.css';

export type DemoContext =
  | 'ActivityFeedPage'
  | 'Dashboard'
  | 'RosterComponent'
  | 'MatchupComponent'
  | 'WaiversComponent';

interface DemoContent {
  title: string;
  body: string[];
}

const CONTENT: Record<DemoContext, DemoContent> = {
  ActivityFeedPage: {
    title: 'League Activity Feed',
    body: [
      'Placeholder — describe what the Activity Feed shows in the demo.',
    ],
  },
  Dashboard: {
    title: 'Dashboard',
    body: [
      'Placeholder — describe what the Dashboard shows in the demo.',
    ],
  },
  RosterComponent: {
    title: 'Your Roster',
    body: [
      'Placeholder — describe what the Roster page shows in the demo.',
    ],
  },
  MatchupComponent: {
    title: 'Weekly Matchup',
    body: [
      'Placeholder — describe what the Matchup page shows in the demo.',
    ],
  },
  WaiversComponent: {
    title: 'Waivers',
    body: [
      'Placeholder — describe what the Waivers page shows in the demo.',
    ],
  },
};

interface DemoInfoModalProps {
  currentLeague: CurrentLeague;
  context: DemoContext;
}

const DemoInfoModal = ({ currentLeague, context }: DemoInfoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (currentLeague.name !== DEMO_LEAGUE_NAME) return null;

  const { title, body } = CONTENT[context];

  return (
    <>
      <button
        className="dim-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Demo info"
        title="About this demo"
      >
        ⓘ
      </button>

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
              {body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
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
