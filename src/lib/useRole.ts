"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "admin" | "funcionario" | "pendente" | null;

export function useRole() {
  const [role, setRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user.id;
      if (!userId) {
        setRole(null);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!roles || roles.length === 0) {
        setRole("pendente");
        return;
      }
      const isAdmin = roles.some((r) => r.role === "admin");
      setRole(isAdmin ? "admin" : "funcionario");
    });
  }, []);

  return role;
}
