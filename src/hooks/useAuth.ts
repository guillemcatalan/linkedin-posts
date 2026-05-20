"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AuthUser {
  id: string;
  name: string;
  nickname: string;
  email: string;
  department: string;
  role: string;
  role_description: string;
  linkedin_url: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setUser({
            id: data.id,
            name: data.name,
            nickname: data.nickname ?? "",
            email: data.email,
            department: data.department ?? "",
            role: data.role ?? "",
            role_description: data.role_description ?? "",
            linkedin_url: data.linkedin_url ?? "",
          });
        }
      }
      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setUser({
            id: data.id,
            name: data.name,
            nickname: data.nickname ?? "",
            email: data.email,
            department: data.department ?? "",
            role: data.role ?? "",
            role_description: data.role_description ?? "",
            linkedin_url: data.linkedin_url ?? "",
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return { user, loading, signOut };
}
