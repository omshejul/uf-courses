import { create } from 'zustand';
import type { InsightWithUser } from "./models/insight";
import type { Category } from "./models/category";

interface CategoryStore {
  categories: Category[];
  courseCategoryMap: Record<string, string[]>;
  setCategories: (categories: Category[]) => void;
  addCategory: (name: string) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addCourseToCategory: (courseCode: string, categoryId: string) => Promise<void>;
  removeCourseFromCategory: (courseCode: string, categoryId: string) => Promise<void>;
  fetchCourseCategories: (courseCode: string) => Promise<void>;
}

interface InsightStore {
  insights: Record<string, InsightWithUser[]>;
  addInsight: (courseCode: string, text: string, difficulty: number, isAnonymous: boolean) => Promise<void>;
  removeInsight: (courseCode: string, insightId: string) => Promise<void>;
  fetchInsights: (courseCode: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  courseCategoryMap: {},
  setCategories: (categories) => set({ categories }),
  
  addCategory: async (name) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      const newCategory = await response.json();
      set((state) => ({ 
        categories: [...state.categories, newCategory] 
      }));
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  },

  removeCategory: async (categoryId) => {
    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove category");
      }

      set((state) => ({ 
        categories: state.categories.filter(c => c._id?.toString() !== categoryId),
        courseCategoryMap: Object.fromEntries(
          Object.entries(state.courseCategoryMap).map(([code, cats]) => [
            code,
            cats.filter(id => id !== categoryId)
          ])
        )
      }));
    } catch (error) {
      console.error("Error removing category:", error);
      throw error;
    }
  },

  fetchCategories: async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const categories = await response.json();
      set({ categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  addCourseToCategory: async (courseCode, categoryId) => {
    try {
      const response = await fetch("/api/course-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode, categoryId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add course to category");
      }

      set((state) => ({
        courseCategoryMap: {
          ...state.courseCategoryMap,
          [courseCode]: [...(state.courseCategoryMap[courseCode] || []), categoryId],
        },
      }));
    } catch (error) {
      console.error("Error adding course to category:", error);
      throw error;
    }
  },

  removeCourseFromCategory: async (courseCode, categoryId) => {
    try {
      const response = await fetch(`/api/course-categories?courseCode=${courseCode}&categoryId=${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove course from category");
      }

      set((state) => ({
        courseCategoryMap: {
          ...state.courseCategoryMap,
          [courseCode]: state.courseCategoryMap[courseCode]?.filter(id => id !== categoryId) || [],
        },
      }));
    } catch (error) {
      console.error("Error removing course from category:", error);
      throw error;
    }
  },

  fetchCourseCategories: async (courseCode) => {
    try {
      const response = await fetch(`/api/course-categories?courseCode=${courseCode}`);
      if (!response.ok) {
        throw new Error("Failed to fetch course categories");
      }
      const assignments = await response.json();
      set((state) => ({
        courseCategoryMap: {
          ...state.courseCategoryMap,
          [courseCode]: assignments.map((a: any) => a.categoryId),
        },
      }));
    } catch (error) {
      console.error("Error fetching course categories:", error);
      throw error;
    }
  },
}));

export const useInsightStore = create<InsightStore>((set) => ({
  insights: {},
  addInsight: async (courseCode, text, difficulty, isAnonymous) => {
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode, text, difficulty, isAnonymous }),
      });

      if (!response.ok) {
        throw new Error("Failed to add insight");
      }

      const newInsight = await response.json();
      set((state) => ({
        insights: {
          ...state.insights,
          [courseCode]: [newInsight, ...(state.insights[courseCode] || [])],
        },
      }));
    } catch (error) {
      console.error("Error adding insight:", error);
      throw error;
    }
  },
  removeInsight: async (courseCode, insightId) => {
    try {
      const response = await fetch(`/api/insights?id=${insightId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove insight");
      }

      set((state) => ({
        insights: {
          ...state.insights,
          [courseCode]: state.insights[courseCode]?.filter(
            (insight) => insight._id?.toString() !== insightId
          ) || [],
        },
      }));
    } catch (error) {
      console.error("Error removing insight:", error);
      throw error;
    }
  },
  fetchInsights: async (courseCode) => {
    try {
      const response = await fetch(`/api/insights?courseCode=${courseCode}`);
      if (!response.ok) {
        throw new Error("Failed to fetch insights");
      }
      const insights = await response.json();
      set((state) => ({
        insights: {
          ...state.insights,
          [courseCode]: insights,
        },
      }));
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw error;
    }
  },
})); 