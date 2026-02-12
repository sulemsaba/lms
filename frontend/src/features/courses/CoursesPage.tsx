import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import styles from "./CoursesPage.module.css";

interface Course {
  id: string;
  title: string;
  lecturer: string;
  cached: boolean;
}

const mockCourses: Course[] = [
  { id: "c1", title: "Data Structures", lecturer: "Dr. Mushi", cached: true },
  { id: "c2", title: "Machine Learning", lecturer: "Prof. Amani", cached: false },
  { id: "c3", title: "Database Systems", lecturer: "Dr. Zawadi", cached: true }
];

/**
 * Course list with cache visibility for offline usage.
 */
export default function CoursesPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <div className={styles.grid}>
      {mockCourses.map((course) => (
        <Card key={course.id}>
          <div className={styles.row}>
            <div>
              <h3>{course.title}</h3>
              <p>{course.lecturer}</p>
            </div>
            <Badge color={course.cached ? "success" : "warning"} text={course.cached ? "Cached" : "Online"} />
          </div>
        </Card>
      ))}
    </div>
  );
}
