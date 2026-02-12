import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Objective } from "./useObjectives";
import type { KeyResult } from "./useKeyResults";

export interface TreeNode {
  objective: Objective;
  keyResults: KeyResult[];
  children: TreeNode[];
}

export function buildTree(objectives: Objective[], keyResults?: KeyResult[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  const krMap = new Map<string, KeyResult[]>();

  if (keyResults) {
    for (const kr of keyResults) {
      if (!krMap.has(kr.objective_id)) krMap.set(kr.objective_id, []);
      krMap.get(kr.objective_id)!.push(kr);
    }
  }

  for (const obj of objectives) {
    map.set(obj.id, { objective: obj, keyResults: krMap.get(obj.id) || [], children: [] });
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
      const [objRes, krRes] = await Promise.all([
        supabase
          .from("objectives")
          .select("*, profiles!objectives_owner_id_fkey(full_name, avatar_url), key_results(id)")
          .eq("cycle_id", cycleId)
          .order("created_at", { ascending: true }),
        supabase
          .from("key_results")
          .select("*, objectives!inner(cycle_id)")
          .eq("objectives.cycle_id", cycleId)
          .order("created_at", { ascending: true }),
      ]);
      if (objRes.error) throw objRes.error;
      if (krRes.error) throw krRes.error;

      const objectives = (objRes.data as any[]).map((o) => ({
        ...o,
        owner_name: o.profiles?.full_name || "Sem dono",
        owner_avatar: o.profiles?.avatar_url || null,
        kr_count: o.key_results?.length ?? 0,
        profiles: undefined,
        key_results: undefined,
      })) as Objective[];

      const keyResults = (krRes.data as any[]).map((kr) => ({
        ...kr,
        objectives: undefined,
      })) as KeyResult[];

      return buildTree(objectives, keyResults);
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
