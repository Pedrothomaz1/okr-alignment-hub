import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Objective } from "./useObjectives";

export interface TreeNode {
  objective: Objective;
  children: TreeNode[];
}

export function buildTree(objectives: Objective[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const obj of objectives) {
    map.set(obj.id, { objective: obj, children: [] });
  }

  for (const obj of objectives) {
    const node = map.get(obj.id)!;
    if (obj.parent_objective_id && map.has(obj.parent_objective_id)) {
      map.get(obj.parent_objective_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useOKRTree(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["okr-tree", cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      const { data, error } = await supabase
        .from("objectives")
        .select("*, profiles!objectives_owner_id_fkey(full_name), key_results(id)")
        .eq("cycle_id", cycleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const objectives = (data as any[]).map((o) => ({
        ...o,
        owner_name: o.profiles?.full_name || "Sem dono",
        kr_count: o.key_results?.length ?? 0,
        profiles: undefined,
        key_results: undefined,
      })) as Objective[];
      return buildTree(objectives);
    },
    enabled: !!cycleId,
  });
}

export function useObjectiveAncestors(objectiveId: string | undefined) {
  return useQuery({
    queryKey: ["objective-ancestors", objectiveId],
    queryFn: async () => {
      if (!objectiveId) return [];
      const { data, error } = await supabase.rpc("get_objective_ancestors", {
        _objective_id: objectiveId,
      });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!objectiveId,
  });
}
