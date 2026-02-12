import styles from "./TimetablePage.module.css";

/**
 * Weekly timetable with venue context.
 */
export default function TimetablePage() {
  return (
    <section className={styles.list}>
      <h2>Timetable</h2>
      <article className={styles.item}>
        <strong>Monday 10:00</strong>
        <p>CS101 - Lecture Hall 1</p>
      </article>
      <article className={styles.item}>
        <strong>Tuesday 14:00</strong>
        <p>DB202 - COICT Lab 3</p>
      </article>
    </section>
  );
}
