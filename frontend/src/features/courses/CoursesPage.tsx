import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { fetchCourses, type CourseListItem } from "@/services/api/coursesApi";
import styles from "./CoursesPage.module.css";

/**
 * Course list with cache visibility for offline usage.
 */
export default function CoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [sourceLabel, setSourceLabel] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchCourses();
      if (!mounted) {
        return;
      }
      setCourses(result.courses);
      if (result.source === "cache") {
        setSourceLabel("Showing cached courses (offline mode).");
      } else if (result.source === "fallback") {
        setSourceLabel("Showing built-in sample courses. Connect once to cache real course data.");
      } else {
        setSourceLabel("");
      }
      setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <div className={styles.grid}>
      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}
      {courses.map((course) => (
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
