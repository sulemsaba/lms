import { useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./QuickRecap.module.css";

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  emoji: string;
  category: string;
}

const SAMPLE_FLASHCARDS: FlashCard[] = [
  {
    id: '1',
    question: 'What is the formula for force?',
    answer: 'F = ma (Force equals mass times acceleration)',
    emoji: 'bolt',
    category: 'Physics'
  },
  {
    id: '2',
    question: 'What is the powerhouse of the cell?',
    answer: 'The mitochondria! It generates most of the cell\'s energy through ATP production.',
    emoji: 'biotech',
    category: 'Biology'
  },
  {
    id: '3',
    question: 'What is the derivative of x²?',
    answer: '2x - The power rule: bring down the exponent and subtract 1.',
    emoji: 'straighten',
    category: 'Math'
  },
  {
    id: '4',
    question: 'What is a variable in programming?',
    answer: 'A container that stores data that can be changed and reused throughout a program.',
    emoji: 'code',
    category: 'Computer Science'
  },
  {
    id: '5',
    question: 'What is the chemical symbol for water?',
    answer: 'H₂O - Two hydrogen atoms bonded to one oxygen atom.',
    emoji: 'science',
    category: 'Chemistry'
  },
];

export default function QuickRecap() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentCard = SAMPLE_FLASHCARDS[currentIndex];
  const isFlipped = flippedCards.has(currentCard.id);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setFlippedCards(prev => new Set(prev));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(SAMPLE_FLASHCARDS.length - 1, prev + 1));
    setFlippedCards(prev => new Set(prev));
  }, []);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setFlippedCards(prev => new Set(prev));
  };

  const toggleFlip = () => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(currentCard.id)) {
        next.delete(currentCard.id);
      } else {
        next.add(currentCard.id);
      }
      return next;
    });
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < SAMPLE_FLASHCARDS.length - 1) {
        goToNext();
      } else if (diff < 0 && currentIndex > 0) {
        goToPrev();
      }
    }
    setTouchStart(null);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="quickreply" size={24} />
          {' '}Quick Recap
        </h2>
        <div className={styles.swipeHint}>
          <Icon name="swipe" size={16} />
          Swipe to browse
        </div>
      </div>

      {/* Carousel */}
      <div className={styles.carousel}>
        <div className={styles.cardsWrapper}>
          <div
            className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
            onClick={toggleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={styles.cardEmoji}><Icon name={currentCard.emoji} size={48} /></div>
            <p className={styles.cardQuestion}>{currentCard.question}</p>
            <p className={styles.cardAnswer}>{currentCard.answer}</p>
            <div className={styles.cardHint}>
              {isFlipped ? 'Tap to hide answer' : 'Tap to reveal answer'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button
          className={styles.navButton}
          onClick={goToPrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <Icon name="chevron_left" size={20} />
        </button>

        <div className={styles.dots}>
          {SAMPLE_FLASHCARDS.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <button
          className={styles.navButton}
          onClick={goToNext}
          disabled={currentIndex === SAMPLE_FLASHCARDS.length - 1}
          aria-label="Next card"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div className={styles.progress}>
        {currentIndex + 1} of {SAMPLE_FLASHCARDS.length} cards
      </div>
    </div>
  );
}
