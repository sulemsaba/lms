import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import { useGamificationStore } from "@/stores/gamificationStore";
import styles from "./FocusMode.module.css";

type FocusPhase = 'focus' | 'break' | 'longBreak';

interface FocusSettings {
  focusDuration: number; // minutes
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  focusLock: boolean;
  breakReminders: boolean;
}

const DEFAULT_SETTINGS: FocusSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  focusLock: true,
  breakReminders: true,
};

export default function FocusMode() {
  const { addXp, updateBadgeProgress } = useGamificationStore();
  
  // Timer state
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<FocusPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [focusLocked, setFocusLocked] = useState(false);
  
  // Break reminder
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  
  // Mental health check
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [motivationLevel, setMotivationLevel] = useState<number | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Handle timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, phase]);

  const handlePhaseComplete = useCallback(() => {
    setIsRunning(false);

    if (phase === 'focus') {
      // Award XP for completing focus session
      addXp(50);
      updateBadgeProgress('focus-5', sessionCount + 1);
      
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      // Show break reminder
      if (settings.breakReminders) {
        setShowBreakReminder(true);
      }

      // Determine next phase
      const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
      const nextPhase: FocusPhase = isLongBreak ? 'longBreak' : 'break';
      
      setPhase(nextPhase);
      if (settings.autoStartBreaks) {
        const duration = isLongBreak ? settings.longBreakDuration : settings.breakDuration;
        setTimeLeft(duration * 60);
        setIsRunning(true);
      } else {
        setTimeLeft(
          isLongBreak ? settings.longBreakDuration * 60 : settings.breakDuration * 60
        );
      }
    } else {
      // Break completed, go back to focus
      setPhase('focus');
      if (settings.autoStartFocus) {
        setTimeLeft(settings.focusDuration * 60);
        setIsRunning(true);
      } else {
        setTimeLeft(settings.focusDuration * 60);
      }
    }
  }, [phase, sessionCount, settings, addXp, updateBadgeProgress]);

  const startTimer = () => {
    setIsRunning(true);
    if (settings.focusLock) {
      setFocusLocked(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setFocusLocked(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setFocusLocked(false);
    setPhase('focus');
    setTimeLeft(settings.focusDuration * 60);
  };

  const skipPhase = () => {
    setIsRunning(false);
    setFocusLocked(false);
    if (phase === 'focus') {
      addXp(25); // Partial XP for skipping
      const nextPhase: FocusPhase = sessionCount > 0 && (sessionCount + 1) % settings.sessionsUntilLongBreak === 0 
        ? 'longBreak' : 'break';
      setPhase(nextPhase);
      setTimeLeft(
        nextPhase === 'longBreak' ? settings.longBreakDuration * 60 : settings.breakDuration * 60
      );
    } else {
      setPhase('focus');
      setTimeLeft(settings.focusDuration * 60);
    }
  };

  const handleDismissBreak = () => {
    setShowBreakReminder(false);
    if (phase !== 'focus') {
      const duration = phase === 'longBreak' ? settings.longBreakDuration : settings.breakDuration;
      setTimeLeft(duration * 60);
      setIsRunning(true);
    }
  };

  const handleSkipBreak = () => {
    setShowBreakReminder(false);
    setPhase('focus');
    setTimeLeft(settings.focusDuration * 60);
    setIsRunning(true);
  };

  const handleHealthSubmit = () => {
    setHealthChecked(true);
    addXp(20); // XP for checking in
  };

  const stressIcons = ['sentiment_very_dissatisfied', 'sentiment_dissatisfied', 'sentiment_neutral', 'sentiment_satisfied', 'sentiment_very_satisfied'];
  const motivationIcons = ['sentiment_very_dissatisfied', 'sentiment_dissatisfied', 'sentiment_neutral', 'mood', 'whatshot'];

  const phaseLabel = {
    focus: 'Focus Time',
    break: 'Short Break',
    longBreak: 'Long Break',
  };

  return (
    <div className={styles.container}>
      {/* Timer Section */}
      <div className={styles.timerSection}>
        <div className={styles.timerStatus}>
          {isRunning ? 'Session in progress' : 'Ready to start'}
        </div>
        
        <div className={styles.timerDisplay}>{timeDisplay}</div>

        {/* Phase Badges */}
        <div className={styles.timerPhase}>
          {(['focus', 'break', 'longBreak'] as const).map((p) => (
            <span
              key={p}
              className={`${styles.phaseBadge} ${phase === p ? styles[p] : styles.inactive}`}
            >
              {phaseLabel[p]}
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className={styles.timerControls}>
          {!isRunning ? (
            <button
              className={`${styles.controlButton} ${styles.startButton}`}
              onClick={startTimer}
              aria-label="Start session"
            >
              <Icon name="play_arrow" size={32} />
            </button>
          ) : (
            <button
              className={`${styles.controlButton} ${styles.pauseButton}`}
              onClick={pauseTimer}
              aria-label="Pause session"
            >
              <Icon name="pause" size={32} />
            </button>
          )}
          
          <button
            className={`${styles.controlButton} ${styles.resetButton}`}
            onClick={resetTimer}
            aria-label="Reset timer"
          >
            <Icon name="restart_alt" size={28} />
          </button>

          {isRunning && (
            <button
              className={`${styles.controlButton} ${styles.skipButton}`}
              onClick={skipPhase}
              aria-label="Skip to next phase"
            >
              <Icon name="skip_next" size={28} />
            </button>
          )}
        </div>

        <div className={styles.sessionCount}>
          Sessions completed: <strong>{sessionCount}</strong>
        </div>
      </div>

      {/* Focus Lock Status */}
      {focusLocked && (
        <div className={`${styles.lockStatus} ${styles.active}`}>
          <Icon name="lock" size={20} />
          Focus Lock Active - Social features and notifications are hidden
        </div>
      )}

      {/* Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.settingsTitle}><Icon name="tune" size={20} /> Settings</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Focus Duration</label>
            <div className={styles.settingInput}>
              <input
                type="number"
                value={settings.focusDuration}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(120, parseInt(e.target.value) || 25));
                  setSettings(s => ({ ...s, focusDuration: val }));
                  if (phase === 'focus') setTimeLeft(val * 60);
                }}
                min={1}
                max={120}
                disabled={isRunning}
              />
              <span className={styles.settingUnit}>min</span>
            </div>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Break Duration</label>
            <div className={styles.settingInput}>
              <input
                type="number"
                value={settings.breakDuration}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 5));
                  setSettings(s => ({ ...s, breakDuration: val }));
                }}
                min={1}
                max={30}
                disabled={isRunning}
              />
              <span className={styles.settingUnit}>min</span>
            </div>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Auto-start Breaks</label>
            <button
              className={`${styles.toggle} ${settings.autoStartBreaks ? styles.active : ''}`}
              onClick={() => setSettings(s => ({ ...s, autoStartBreaks: !s.autoStartBreaks }))}
              aria-label="Toggle auto-start breaks"
            >
              <div className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Focus Lock</label>
            <button
              className={`${styles.toggle} ${settings.focusLock ? styles.active : ''}`}
              onClick={() => setSettings(s => ({ ...s, focusLock: !s.focusLock }))}
              aria-label="Toggle focus lock"
            >
              <div className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>Break Reminders</label>
            <button
              className={`${styles.toggle} ${settings.breakReminders ? styles.active : ''}`}
              onClick={() => setSettings(s => ({ ...s, breakReminders: !s.breakReminders }))}
              aria-label="Toggle break reminders"
            >
              <div className={styles.toggleKnob} />
            </button>
          </div>
        </div>
      </div>

      {/* Mental Health Check */}
      {!healthChecked && (
        <div className={styles.healthCheck}>
          <h3 className={styles.healthTitle}><Icon name="favorite" size={20} /> Mental Health Check</h3>
          <p className={styles.healthSubtitle}>
            How are you feeling? This helps us support you better.
          </p>
          
          <div className={styles.healthQuestions}>
            <div className={styles.healthQuestion}>
              <label>How stressed are you?</label>
              <div className={styles.healthEmojis}>
                {stressIcons.map((icon, i) => (
                  <button
                    key={i}
                    className={`${styles.healthEmoji} ${stressLevel === i ? styles.selected : ''}`}
                    onClick={() => setStressLevel(i)}
                    aria-label={`Stress level ${i + 1}`}
                  >
                    <Icon name={icon} size={28} />
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.healthQuestion}>
              <label>How motivated are you?</label>
              <div className={styles.healthEmojis}>
                {motivationIcons.map((icon, i) => (
                  <button
                    key={i}
                    className={`${styles.healthEmoji} ${motivationLevel === i ? styles.selected : ''}`}
                    onClick={() => setMotivationLevel(i)}
                    aria-label={`Motivation level ${i + 1}`}
                  >
                    <Icon name={icon} size={28} />
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`${styles.breakButton} ${styles.primary}`}
              onClick={handleHealthSubmit}
              disabled={stressLevel === null || motivationLevel === null}
            >
              <Icon name="favorite" size={18} />
              Submit Check-in
            </button>
          </div>

          {(stressLevel !== null && stressLevel < 2) && (
            <div className={styles.healthResources}>
              <p>
                It looks like you might be feeling stressed. Remember, the 
                <strong> Campus Counseling Center</strong> is here for you.
                Visit <strong>Room 101, Student Center</strong> or call 
                <strong> +255 123 456 789</strong>. You're not alone!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Break Reminder Overlay */}
      {showBreakReminder && (
        <div className={styles.breakReminder}>
          <div className={styles.breakCard}>
            <div className={styles.breakEmoji}><Icon name="coffee" size={48} /></div>
            <h2 className={styles.breakTitle}>Time for a Break!</h2>
            <p className={styles.breakText}>
              You've been studying hard! Take a {phase === 'longBreak' ? 'long' : 'short'} break 
              to recharge and maintain focus.
            </p>
            <div className={styles.breakActions}>
              <button
                className={`${styles.breakButton} ${styles.primary}`}
                onClick={handleDismissBreak}
              >
                <Icon name="coffee" size={18} />
                Take a break
              </button>
              <button
                className={`${styles.breakButton} ${styles.secondary}`}
                onClick={handleSkipBreak}
              >
                <Icon name="skip_next" size={18} />
                Skip Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
