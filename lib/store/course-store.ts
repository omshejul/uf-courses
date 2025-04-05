import { create } from 'zustand';
import type { InsightWithUser } from '@/lib/models/insight';
import type { Category } from '@/lib/models/category';

interface CourseStore {
  // Single source of truth for all data
  courseData: Record<string, {
    insights: InsightWithUser[];
    categories: string[];
  }>;
  allCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllData: (courseCodes: string[]) => Promise<void>;
  addInsight: (courseCode: string, text: string, difficulty: number, isAnonymous: boolean) => Promise<void>;
  removeInsight: (courseCode: string, insightId: string) => Promise<void>;
  toggleCategory: (courseCode: string, categoryId: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  clearError: () => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courseData: {},
  allCategories: [],
  isLoading: false,
  error: null,

  fetchAllData: async (courseCodes) => {
    try {
      set({ isLoading: true, error: null });

      // Get categories first
      const catResponse = await fetch('/api/categories');
      if (!catResponse.ok) throw new Error('Failed to fetch categories');
      const categories = await catResponse.json();
      set({ allCategories: categories });

      // Then get course data
      const response = await fetch(`/api/batch?courseCodes=${courseCodes.join(",")}`);
      if (!response.ok) throw new Error('Failed to fetch course data');
      const data = await response.json();

      // Update store with all data
      set(state => ({
        courseData: {
          ...state.courseData,
          ...Object.fromEntries(
            courseCodes.map(code => [code, {
              insights: data[code]?.insights || [],
              categories: data[code]?.categories?.map((c: { categoryId: string }) => c.categoryId.toString()) || [],
            }])
          )
        },
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
    }
  },

  toggleCategory: async (courseCode, categoryId) => {
    try {
      const courseInfo = get().courseData[courseCode] || { insights: [], categories: [] };
      const hasCategory = courseInfo.categories.includes(categoryId);

      const response = await fetch(`/api/course-categories${hasCategory ? `?courseCode=${courseCode}&categoryId=${categoryId}` : ''}`, {
        method: hasCategory ? 'DELETE' : 'POST',
        headers: hasCategory ? undefined : { 'Content-Type': 'application/json' },
        body: hasCategory ? undefined : JSON.stringify({ courseCode, categoryId }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      // Update course categories immediately
      set(state => ({
        courseData: {
          ...state.courseData,
          [courseCode]: {
            ...courseInfo,
            categories: hasCategory
              ? courseInfo.categories.filter(id => id !== categoryId)
              : [...courseInfo.categories, categoryId],
          }
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update category' });
    }
  },

  addCategory: async (name) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to add category');
      const newCategory = await response.json();

      // Update categories immediately
      set(state => ({
        allCategories: [...state.allCategories, newCategory],
      }));

      return newCategory;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add category' });
      return null;
    }
  },

  removeCategory: async (categoryId) => {
    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove category');

      set(state => ({
        allCategories: state.allCategories.filter(c => c._id?.toString() !== categoryId),
        courseData: Object.fromEntries(
          Object.entries(state.courseData).map(([code, data]) => [
            code,
            {
              ...data,
              categories: data.categories.filter(id => id !== categoryId)
            }
          ])
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove category' });
    }
  },

  addInsight: async (courseCode, text, difficulty, isAnonymous) => {
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCode, text, difficulty, isAnonymous }),
      });

      if (!response.ok) throw new Error('Failed to add insight');
      const newInsight = await response.json();

      set(state => ({
        courseData: {
          ...state.courseData,
          [courseCode]: {
            ...state.courseData[courseCode],
            insights: [...(state.courseData[courseCode]?.insights || []), newInsight],
          }
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add insight' });
    }
  },

  removeInsight: async (courseCode, insightId) => {
    try {
      const response = await fetch(`/api/insights?id=${insightId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove insight');

      set(state => ({
        courseData: {
          ...state.courseData,
          [courseCode]: {
            ...state.courseData[courseCode],
            insights: state.courseData[courseCode]?.insights.filter(
              i => i._id?.toString() !== insightId
            ) || [],
          }
        }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove insight' });
    }
  },

  clearError: () => set({ error: null }),
})); 