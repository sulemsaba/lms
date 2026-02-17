import { STUDENT_FEATURES } from "@/features/dashboard/DashboardApp";
import { buildStudentFeaturePaths } from "@/features/auth/roleAccess";

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
    const visibleStudentFeatures = STUDENT_FEATURES.filter((feature) => allowedPaths.has(feature.path));

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
