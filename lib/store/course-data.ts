import { create } from 'zustand';
import type { InsightWithUser } from '@/lib/models/insight';

interface CourseData {
  insights: InsightWithUser[];
  categories: { _id: string, courseCode: string, categoryId: string, categoryName: string }[];
}

interface CourseDataStore {
  data: Record<string, CourseData>;
  isLoading: boolean;
  error: string | null;
  fetchData: (courseCodes: string[]) => Promise<void>;
  clearError: () => void;
}

export const useCourseDataStore = create<CourseDataStore>((set) => ({
  data: {},
  isLoading: false,
  error: null,

  fetchData: async (courseCodes) => {
    try {
      set({ isLoading: true, error: null });
      
      // Filter out course codes we already have data for
      const newCourseCodes = courseCodes.filter(
        code => !Object.keys(useCourseDataStore.getState().data).includes(code)
      );

      if (newCourseCodes.length === 0) {
        set({ isLoading: false });
        return;
      }

      const response = await fetch(`/api/batch?courseCodes=${newCourseCodes.join(",")}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }

      const newData = await response.json();

      set((state) => ({
        data: { ...state.data, ...newData },
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
})); 