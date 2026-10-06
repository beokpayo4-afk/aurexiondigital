import axios from "axios";

import { api } from "@/api/client";
import { cachedPublic } from "@/api/publicCache";

export type LessonOutline = {
  id: string;
  title: string;
  content_type: string;
  is_preview: boolean;
  body: string | null;
};

export type ModuleOutline = {
  id: string;
  title: string;
  lessons: LessonOutline[];
};

export type ResourceFlag = {
  id: string;
  title: string;
  available: boolean;
};

export type CourseOutline = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  level: string | null;
  duration_label: string | null;
  thumbnail_url: string | null;
  learning_outcomes: string[];
  certificate_enabled: boolean;
  price_amount: string | null;
  currency: string;
  modules: ModuleOutline[];
  resources: ResourceFlag[];
  enrollment_status: string | null;
};

export type LessonStudy = {
  id: string;
  title: string;
  content_type: string;
  body: string | null;
  external_url: string | null;
  completed: boolean;
};

export type ModuleStudy = {
  id: string;
  title: string;
  lessons: LessonStudy[];
};

export type CertificateInfo = {
  enabled: boolean;
  number: string | null;
  status: string | null;
};

export type LearnCourse = {
  course_id: string;
  title: string;
  progress_percent: number;
  certificate: CertificateInfo;
  modules: ModuleStudy[];
  resources: ResourceFlag[];
};

export type EnrollmentSummary = {
  enrollment_id: string;
  course_id: string;
  slug: string;
  title: string;
  status: string;
  progress_percent: number;
  certificate: CertificateInfo;
};

export type AcademyCheckout = {
  order_id: string;
  order_number: string;
  status: string;
  course_id: string;
  enrollment_status: string;
};

export async function getCourseOutline(slug: string): Promise<CourseOutline | null> {
  return cachedPublic(`course:${slug}`, async () => {
    try {
      const response = await api.get<CourseOutline>(`/academy/courses/${encodeURIComponent(slug)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  });
}

export async function buyCourse(courseId: string): Promise<AcademyCheckout> {
  const response = await api.post<AcademyCheckout>("/academy/checkout", { course_id: courseId });
  return response.data;
}

export async function listEnrollments(): Promise<EnrollmentSummary[]> {
  const response = await api.get<EnrollmentSummary[]>("/academy/me");
  return response.data;
}

export async function getStudyCourse(courseId: string): Promise<LearnCourse> {
  const response = await api.get<LearnCourse>(`/academy/study/${courseId}`);
  return response.data;
}

export async function completeLesson(lessonId: string): Promise<{ progress_percent: number; certificate: CertificateInfo }> {
  const response = await api.post<{ progress_percent: number; certificate: CertificateInfo }>(`/academy/lessons/${lessonId}/complete`);
  return response.data;
}

export async function downloadResource(resourceId: string): Promise<void> {
  const response = await api.get<Blob>(`/academy/resources/${resourceId}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "download";
  link.click();
  URL.revokeObjectURL(url);
}
