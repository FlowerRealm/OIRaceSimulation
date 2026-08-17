import { AchievementOverlay } from './components/AchievementOverlay';
import { ActiveSkillsBar } from './components/ActiveSkillsBar';
import { AttrsPanel } from './components/AttrsPanel';
import { AuthOverlay } from './components/AuthOverlay';
import { CanvasStage } from './components/CanvasStage';
import { ChallengeOverlay } from './components/ChallengeOverlay';
import { GameOverOverlay } from './components/GameOverOverlay';
import { GlobalMessage } from './components/GlobalMessage';
import { InfoBar } from './components/InfoBar';
import { LevelBanner } from './components/LevelBanner';
import { MapSelector } from './components/MapSelector';
import { ScoreBar } from './components/ScoreBar';
import { ShopOverlay } from './components/ShopOverlay';
import { SidePanel } from './components/SidePanel';
import { StartOverlay } from './components/StartOverlay';
import { TimePanel } from './components/TimePanel';

/**
 * The full page skeleton.
 *
 * App holds no state on purpose. React paints this tree once, then the engine
 * takes over the same nodes by id exactly as it did when the markup was inline
 * in index.html — so the port cannot change behaviour. Components move off the
 * engine one at a time by lifting their engine writes into props.
 */
export default function App() {
  return (
    <>
      <div className="main-wrapper">
        <div className="game-container" id="gameContainer">
          <LevelBanner />
          <GlobalMessage />
          <AttrsPanel />
          <ActiveSkillsBar />
          <ScoreBar />
          <TimePanel />
          <MapSelector />
          <CanvasStage />
          <InfoBar />
        </div>
        <SidePanel />
      </div>

      <StartOverlay />
      <AuthOverlay />
      <ChallengeOverlay />
      <ShopOverlay />
      <GameOverOverlay />
      <AchievementOverlay />

      <div className="challenge-tip-popup" id="challengeTipPopup" />
      <div
        id="discussionContainer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 200,
        }}
      />
      <div
        id="achievementPopupContainer"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      />
    </>
  );
}
