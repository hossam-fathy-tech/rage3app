import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface SavedItem {
  id: string;
  item_type: "course" | "summary" | "lesson";
  item_id: string;
  title: string;
  subtitle?: string;
  created_at: string;
}

const STORAGE_KEY = "raga3_saved_items";

export function useSavedItems() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        try { setSavedIds(new Set(JSON.parse(stored))); } catch {}
      }
    }
  }, [user?.id]);

  const isSaved = (type: string, id: string) => savedIds.has(`${type}:${id}`);

  const toggleSave = (type: string, id: string, title: string, subtitle?: string) => {
    if (!user) { toast.error("سجّل الدخول الأول"); return; }
    const key = `${type}:${id}`;
    const newSet = new Set(savedIds);
    if (newSet.has(key)) {
      newSet.delete(key);
      toast.success("تم الإزالة من المحفوظات");
    } else {
      newSet.add(key);
      toast.success("تم الحفظ");
    }
    setSavedIds(newSet);
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify([...newSet]));
  };

  return { isSaved, toggleSave, savedIds };
}

interface SaveButtonProps {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SaveButton({ type, id, title, subtitle, className = "" }: SaveButtonProps) {
  const { isSaved, toggleSave } = useSavedItems();
  const saved = isSaved(type, id);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleSave(type, id, title, subtitle); }}
      className={`p-2 rounded-lg transition-colors ${saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"} ${className}`}
    >
      {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
    </button>
  );
}
