import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./ProgressSection.module.css";

interface ProgressSectionProps {
  isCollapsed?: boolean;
}

interface DailyProgress {
  completed: number;
  total: number;
  streak: number;
  focusTime: number; // in minutes
  points: number;
}

export default function ProgressSection({ isCollapsed = false }: ProgressSectionProps) {
  const [progress, setProgress] = useState<DailyProgress>({
    completed: 3,
    total: 8,
    streak: 7,
    focusTime: 135,
    points: 2450
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [celebrations, setCelebrations] = useState<string[]>([]);

  // Simulate loading progress data
  useEffect(() => {
    const timer = setTimeout(() => {
      // In real app, fetch from API
      setProgress({
        completed: Math.floor(Math.random() * 8) + 1,
        total: 8,
        streak: Math.floor(Math.random() * 21) + 1,
        focusTime: Math.floor(Math.random() * 240) + 60,
        points: Math.floor(Math.random() * 5000) + 1000
      });
      setIsLoading(false);
      
      // Random celebrations
      if (Math.random() > 0.7) {
        const newCelebrations = ['Task completed!', '3-day streak!', 'Level up!'];
        setCelebrations(prev => [...prev, newCelebrations[Math.floor(Math.random() * newCelebrations.length)]]);
        setTimeout(() => {
          setCelebrations(prev => prev.slice(1));
        }, 3000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const completionPercentage = (progress.completed / progress.total) * 100;
  const streakPercentage = (progress.streak / 21) * 100; // 21 days to form a habit

  if (isCollapsed) {
    return (
      <div className={styles.collapsedContainer}>
        <div className={styles.collapsedStreak}>
          <Icon name="local_fire_department" size={20} />
          <span className={styles.streakNumber}>{progress.streak}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonProgress} />
        <div className={styles.skeletonStats} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Celebrations */}
      {celebrations.length > 0 && (
        <div className={styles.celebrationContainer}>
          {celebrations.map((msg, index) => (
            <div 
              key={index} 
              className={styles.celebration}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className={styles.celebrationEmoji}>🎉</span>
              <span className={styles.celebrationText}>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>Today's Progress</h3>
          <div className={styles.pointsBadge}>
            <Icon name="star" size={14} />
            <span>{progress.points.toLocaleString()}</span>
          </div>
        </div>
        <button 
          className={styles.moreButton}
          aria-label="View detailed progress"
        >
          <Icon name="more_horiz" size={20} />
        </button>
      </div>

      {/* Streak Display */}
      <div className={styles.streakSection}>
        <div className={styles.streakInfo}>
          <div className={styles.streakIcon}>
            <Icon name="local_fire_department" size={24} />
          </div>
          <div className={styles.streakDetails}>
            <div className={styles.streakLabel}>Learning Streak</div>
            <div className={styles.streakValue}>
              <span className={styles.streakNumber}>{progress.streak}</span>
              <span className={styles.streakUnit}>days</span>
            </div>
          </div>
        </div>
        <div className={styles.streakProgress}>
          <div 
            className={styles.streakProgressBar}
            style={{ width: `${Math.min(streakPercentage, 100)}%` }}
          />
          <div className={styles.streakMilestones}>
            <span className={styles.milestone}>7</span>
            <span className={styles.milestone}>14</span>
            <span className={styles.milestone}>21</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className={styles.progressGrid}>
        <div className={styles.progressItem}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Tasks</span>
            <span className={styles.progressCount}>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className={styles.progressSubtext}>
            {completionPercentage >= 100 ? 'All done!' : 'Keep going!'}
          </div>
        </div>

        <div className={styles.progressItem}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Focus Time</span>
            <span className={styles.progressCount}>
              {Math.floor(progress.focusTime / 60)}h {progress.focusTime % 60}m
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} ${styles.focusFill}`}
              style={{ width: `${Math.min((progress.focusTime / 240) * 100, 100)}%` }}
            />
          </div>
          <div className={styles.progressSubtext}>
            Goal: 4 hours daily
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Icon name="check_circle" size={18} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{progress.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Icon name="timer" size={18} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {Math.floor(progress.focusTime / 60)}h
            </div>
            <div className={styles.statLabel}>Focus</div>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Icon name="trending_up" size={18} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {Math.round(completionPercentage)}%
            </div>
            <div className={styles.statLabel}>Progress</div>
          </div>
        </div>
        
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Icon name="emoji_events" size={18} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {Math.floor(progress.points / 1000)}k
            </div>
            <div className={styles.statLabel}>Points</div>
          </div>
        </div>
      </div>

      {/* Motivation Quote */}
      <div className={styles.motivation}>
        <Icon name="lightbulb" size={16} className={styles.motivationIcon} />
        <p className={styles.motivationText}>
          "Every expert was once a beginner. Keep going!"
        </p>
      </div>
    </div>
  );
}