import { buildStudentFeaturePaths } from "@/features/auth/roleAccess";

interface StudentFeature {
    label: string;
    icon: string;
    path: string;
    summary: string;
}

const STUDENT_FEATURES: StudentFeature[] = [
    { label: "My Courses", icon: "menu_book", path: "/courses", summary: "Track enrolled courses and materials." },
    { label: "Assessments", icon: "assignment", path: "/assessments", summary: "Review quizzes and submissions." },
    { label: "Assignments", icon: "assignment", path: "/assignments", summary: "Manage upcoming coursework deadlines." },
    { label: "Timetable", icon: "calendar_month", path: "/timetable", summary: "Check lectures and weekly schedule." },
    { label: "Results", icon: "account_balance", path: "/results", summary: "View grades and performance trends." },
    { label: "Payments", icon: "receipt_long", path: "/payments", summary: "Track tuition and payment history." },
    { label: "Community", icon: "forum", path: "/community", summary: "Join discussions and student updates." },
    { label: "Helpdesk", icon: "support_agent", path: "/helpdesk", summary: "Request academic or technical support." },
    { label: "Tasks", icon: "checklist", path: "/tasks", summary: "Plan personal and course-related tasks." },
    { label: "Notes", icon: "edit_note", path: "/notes", summary: "Create and organize study notes." },
    { label: "Alerts", icon: "notifications", path: "/notifications", summary: "Stay on top of key announcements." },
    { label: "Queue Manager", icon: "sync", path: "/queue-manager", summary: "Monitor offline sync queue status." },
    { label: "Focus Mode", icon: "timer", path: "/focus-mode", summary: "Run focused study sessions with timers." },
    { label: "Resources", icon: "folder_open", path: "/resources", summary: "Access course files and references." },
    { label: "Study Groups", icon: "group", path: "/study-groups", summary: "Coordinate peer learning sessions." },
    { label: "Campus Map", icon: "map", path: "/map", summary: "Navigate buildings and learning spaces." },
    { label: "Search", icon: "search", path: "/search", summary: "Find modules, pages, and resources quickly." },
    { label: "Profile", icon: "person", path: "/profile", summary: "Manage your student account details." }
];

export interface DashboardData {
    welcomeMessage: string;
    gpa: number;
    gpaTrend: number;
    attendance: number;
    assignments: number;
    assignmentsPending: number;
    nextClass: string;
    nextClassTime: string;
    schedule: any[];
    resources: any[];
    onlineClassmates: any[];
    visibleStudentFeatures: any[];
}

export async function getDashboardData(roleCodes: string[], permissions: string[]): Promise<DashboardData> {
    // Mocking data for now
    const allowedPaths = new Set(buildStudentFeaturePaths(roleCodes, permissions));
    const visibleStudentFeatures = STUDENT_FEATURES.filter((feature: StudentFeature) => allowedPaths.has(feature.path));

    return {
        welcomeMessage: "Welcome back, Suleiman!",
        gpa: 3.8,
        gpaTrend: 0.2,
        attendance: 95,
        assignments: 12,
        assignmentsPending: 3,
        nextClass: "CS101 - Hall 4",
        nextClassTime: "45m",
        schedule: [
            {
                icon: "code",
                iconColor: "primary",
                title: "CS101: Intro to Programming",
                time: "10:00 AM - 12:00 PM - Lecture Hall 1",
                tag: "Lecture",
                tagColor: "lecture",
            },
            {
                icon: "functions",
                iconColor: "orange",
                title: "MT200: Discrete Mathematics",
                time: "02:00 PM - 04:00 PM - Seminar Room 3",
                tag: "Tutorial",
                tagColor: "tutorial",
            },
            {
                icon: "timer",
                iconColor: "alert",
                title: "Study Group: Algorithms",
                time: "05:00 PM - Library",
                tag: "",
                tagColor: "",
            },
        ],
        resources: [
            {
                icon: "picture_as_pdf",
                iconColor: "pdf",
                title: "Algebra_Notes.pdf",
                meta: "2.4 MB - Just now",
            },
            {
                icon: "description",
                iconColor: "doc",
                title: "Project_Brief.docx",
                meta: "500 KB - 2 hrs ago",
            },
        ],
        onlineClassmates: [
            {
                avatar: "felix",
                name: "Francis Tran",
                status: "Studying Biology",
                statusColor: "online",
            },
            {
                avatar: "eliana",
                name: "Eliana P.",
                status: "Idle for 10m",
                statusColor: "",
            },
        ],
        visibleStudentFeatures,
    };
}
