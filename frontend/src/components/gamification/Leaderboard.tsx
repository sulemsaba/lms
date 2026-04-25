import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useGamificationStore } from "@/stores/gamificationStore";
import styles from "./Leaderboard.module.css";

export default function Leaderboard() {
  const { leaderboard, leaderboardHidden, setLeaderboardHidden } = useGamificationStore();
  const [showHidden, setShowHidden] = useState(false);

  if (leaderboardHidden && !showHidden) {
    return (
      <div className={styles.container}>
        <div className={styles.hidden}>
          <div className={styles.hiddenIcon}><Icon name="emoji_events" size={48} /></div>
          <p className={styles.hiddenText}>Leaderboard is hidden</p>
          <p className={styles.hiddenSubtext}>
            You can focus better without the comparison. Your stats are still being tracked.
          </p>
          <button
            className={styles.showButton}
            onClick={() => setShowHidden(true)}
          >
            Show Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="emoji_events" size={24} />
          {' '}Leaderboard
        </h2>
        <button
          className={styles.hideButton}
          onClick={() => {
            setLeaderboardHidden(!leaderboardHidden);
            setShowHidden(false);
          }}
        >
          <Icon name={leaderboardHidden ? "visibility" : "visibility_off"} size={16} />
          {leaderboardHidden ? "Show" : "Hide"}
        </button>
      </div>

      {/* Podium (Top 3) */}
      <div className={styles.podium}>
        {top3.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.podiumSpot} ${
              entry.rank === 1 ? styles.spot1 : entry.rank === 2 ? styles.spot2 : styles.spot3
            }`}
          >
            <div className={styles.podiumRank}>#{entry.rank}</div>
            <div className={styles.podiumAvatar}><Icon name={entry.avatar} size={28} /></div>
            <div className={styles.podiumName}>{entry.name}</div>
            <div className={styles.podiumXp}>{entry.xp.toLocaleString()} XP</div>
            <div className={styles.podiumStreak}>
              <Icon name="local_fire_department" size={12} />
              {entry.streak} day streak
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className={styles.list}>
        {rest.map((entry) => {
          const isCurrentUser = entry.name === "You";
          return (
            <div
              key={entry.id}
              className={`${styles.entry} ${isCurrentUser ? styles.currentUser : ''}`}
            >
              <span className={`${styles.rank} ${
                entry.rank === 4 ? styles.rankGold :
                entry.rank === 5 ? styles.rankSilver :
                entry.rank === 6 ? styles.rankBronze : ''
              }`}>
                #{entry.rank}
              </span>
              <span className={styles.avatar}><Icon name={entry.avatar} size={24} /></span>
              <span className={styles.name}>{entry.name}</span>
              <div className={styles.stats}>
                <span className={styles.xp}>{entry.xp.toLocaleString()} XP</span>
                <span className={styles.level}>Lvl {entry.level}</span>
                <span className={styles.streak}>
                  <Icon name="local_fire_department" size={14} />
                  {entry.streak}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
