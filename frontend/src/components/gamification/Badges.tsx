import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useGamificationStore } from "@/stores/gamificationStore";
import styles from "./Badges.module.css";

const CATEGORIES = [
  { id: 'all', label: 'All Badges', icon: 'stars' },
  { id: 'streak', label: 'Streaks', icon: 'local_fire_department' },
  { id: 'learning', label: 'Learning', icon: 'menu_book' },
  { id: 'social', label: 'Social', icon: 'groups' },
  { id: 'achievement', label: 'Achievements', icon: 'emoji_events' },
  { id: 'special', label: 'Special', icon: 'auto_awesome' },
] as const;

export default function Badges() {
  const { badges } = useGamificationStore();
  const [activeCategory, setActiveCategory] = useState('all');

  const unlockedCount = badges.filter(b => b.unlockedAt).length;
  const totalCount = badges.length;

  const filteredBadges = activeCategory === 'all'
    ? badges
    : badges.filter(b => b.category === activeCategory);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="military_tech" size={24} />
          {' '}Badges & Achievements
        </h2>
        <span className={styles.badgeCount}>
          {unlockedCount} / {totalCount} unlocked
        </span>
      </div>

      {/* Category Tabs */}
      <div className={styles.categoryTabs}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.active : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <Icon name={cat.icon} size={14} />
            {' '}{cat.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className={styles.grid}>
        {filteredBadges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;
          const progress = (badge.progress / badge.requirement) * 100;
          
          return (
            <div
              key={badge.id}
              className={`${styles.badge} ${isUnlocked ? styles.unlocked : styles.locked}`}
              title={badge.description}
            >
              <div className={styles.badgeIcon}>
                <Icon name={badge.icon} size={24} />
              </div>
              <div className={styles.badgeName}>{badge.name}</div>
              <div className={styles.badgeDesc}>{badge.description}</div>
              
              {isUnlocked ? (
                <div className={styles.badgeDate}>
                  Unlocked {new Date(badge.unlockedAt!).toLocaleDateString()}
                </div>
              ) : (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
