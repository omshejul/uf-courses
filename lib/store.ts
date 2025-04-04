import { create } from 'zustand';
import type { InsightWithUser } from "./models/insight";

interface CategoryStore {
  categories: string[];
  setCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
}



interface InsightStore {
  insights: Record<string, InsightWithUser[]>;
  addInsight: (courseCode: string, text: string, difficulty: number, isAnonymous: boolean) => Promise<void>;
  removeInsight: (courseCode: string, insightId: string) => Promise<void>;
  fetchInsights: (courseCode: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ 
    categories: [...state.categories, category] 
  })),
  removeCategory: (category) => set((state) => ({ 
    categories: state.categories.filter(c => c !== category) 
  })),
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