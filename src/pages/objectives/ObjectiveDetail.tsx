import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Target, Lock, Users, LinkIcon, ChevronRight, Unlock, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useKeyResults } from "@/hooks/useKeyResults";
import { useCycles } from "@/hooks/useCycles";
import { useObjectiveAncestors } from "@/hooks/useOKRTree";
import { useOKRCollaborators } from "@/hooks/useOKRCollaborators";
import { useOKRLinks } from "@/hooks/useOKRLinks";
import { useChangeRequests } from "@/hooks/useChangeRequests";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { KeyResultCard } from "@/components/okr/KeyResultCard";
import { WeightDistributor } from "@/components/okr/WeightDistributor";
import { KeyResultForm } from "@/components/okr/KeyResultForm";
import { ObjectiveForm } from "@/pages/objectives/ObjectiveForm";
import { useObjectives } from "@/hooks/useObjectives";
import { ChangeRequestCard } from "@/components/cycles/ChangeRequestCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { KeyResult } from "@/hooks/useKeyResults";

const statusLabel: Record<string, string> = {
  on_track: "No caminho",
  at_risk: "Em risco",
  behind: "Atrasado",
  completed: "Concluído",
};
const statusBadge: Record<string, string> = {
  on_track: "badge-success",
  at_risk: "badge-warning",
  behind: "badge-destructive",
  completed: "badge-info",
};

export default function ObjectiveDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isPrivileged = can("objectives.edit_any");
  const canDeleteObj = can("objectives.delete");
  const canDeleteKr = can("kr.delete");
  const navigate = useNavigate();
  const [krFormOpen, setKrFormOpen] = useState(false);
  const [editingKr, setEditingKr] = useState<KeyResult | null>(null);
  const [editObjOpen, setEditObjOpen] = useState(false);

  const objectiveQuery = useQuery({
    queryKey: ["objective", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("objectives")
        .select("*, profiles!objectives_owner_id_fkey(full_name), cycles(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const { keyResults, isLoading: krsLoading, createKeyResult, updateKeyResult, updateProgress, deleteKeyResult } = useKeyResults(id);
  const { cycles } = useCycles();
  const { data: ancestors } = useObjectiveAncestors(id);
  const { collaborators } = useOKRCollaborators(id);
  const { links } = useOKRLinks(id);
  const { changeRequests, hasActiveApproval } = useChangeRequests(id);
  const obj = objectiveQuery.data;
  const { objectives: siblingObjectives, updateObjective, deleteObjective } = useObjectives(obj?.cycle_id);

  // Check if objective has children
  const hasChildren = siblingObjectives.some((o) => o.parent_objective_id === id);
  const hasKRs = keyResults.length > 0;
  const hasLinkedItems = hasChildren || hasKRs || collaborators.length > 0 || links.length > 0;
  const canDelete = isAdmin && !hasLinkedItems;
  const parentCycle = obj ? cycles.find((c) => c.id === obj.cycle_id) : null;
  const isCycleLocked = parentCycle?.locked ?? false;
  const activeApproval = hasActiveApproval(id);
  const isObjOwner = user?.id === obj?.owner_id;
  const canEditObj = (isObjOwner || isPrivileged) && (!isCycleLocked || activeApproval);
  const canEditKr = (kr: KeyResult) => (kr.owner_id === user?.id || isPrivileged) && (!isCycleLocked || activeApproval);
  const canCheckinKr = (kr: KeyResult) => kr.owner_id === user?.id || isPrivileged;

  // Find the active approval's expiry for banner
  const activeApprovalCr = changeRequests.find(
    (cr) => cr.status === "approved" && cr.expires_at && new Date(cr.expires_at) > new Date()
  );

  if (objectiveQuery.isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  if (!obj) {
    return (
      <div className="space-y-4">
        <Link to="/cycles"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link>
        <p className="text-muted-foreground">Objetivo não encontrado.</p>
      </div>
    );
  }

  const handleCreateKr = (values: any) => {
    createKeyResult.mutate(
      { ...values, objective_id: id! },
      {
        onSuccess: () => { setKrFormOpen(false); toast({ title: "Key Result criado" }); },
        onError: (e) => toast({ title: "Erro", description: String(e), variant: "destructive" }),
      }
    );
  };

  const handleUpdateKr = (values: any) => {
    if (!editingKr) return;
    updateKeyResult.mutate(
      { id: editingKr.id, ...values },
      {
        onSuccess: () => { setEditingKr(null); toast({ title: "Key Result atualizado" }); },
        onError: (e) => toast({ title: "Erro", description: String(e), variant: "destructive" }),
      }
    );
  };

  const handleProgressUpdate = (krId: string, value: number) => {
    updateProgress.mutate({ id: krId, current_value: value });
  };

  const handleWeightUpdate = (krId: string, weight: number) => {
    updateKeyResult.mutate({ id: krId, weight });
  };

  const getExistingWeights = (excludeKrId?: string) =>
    keyResults.filter((kr) => kr.id !== excludeKrId).map((kr) => kr.weight);

  // Ancestors breadcrumb (exclude current)
  const ancestorList = (ancestors || []).filter((a: any) => a.id !== id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb de alinhamento */}
      {ancestorList.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          {ancestorList.map((a: any) => (
            <span key={a.id} className="flex items-center gap-1">
              <Link to={`/objectives/${a.id}`} className="hover:underline hover:text-foreground">
                {a.title}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </span>
          ))}
          <span className="text-foreground font-medium">{obj.title}</span>
        </nav>
      )}

      <div className="flex items-center gap-4">
        <Link to={`/cycles/${obj.cycle_id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao ciclo</Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{obj.cycles?.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{obj.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={statusBadge[obj.status] || "badge-info"}>{statusLabel[obj.status] || obj.status}</span>
            <Avatar className="h-6 w-6">
              {obj.profiles?.avatar_url && <AvatarImage src={obj.profiles.avatar_url} alt={obj.profiles?.full_name} />}
              <AvatarFallback className="text-[10px]">{(obj.profiles?.full_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{obj.profiles?.full_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEditObj && (
            <Button variant="outline" size="sm" onClick={() => setEditObjOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={hasLinkedItems}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
              </AlertDialogTrigger>
              {canDelete ? (
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir objetivo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir "{obj.title}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        deleteObjective.mutate(obj.id, {
                          onSuccess: () => {
                            toast({ title: "Objetivo excluído" });
                            navigate(`/cycles/${obj.cycle_id}`);
                          },
                          onError: (e) => toast({ title: "Erro ao excluir", description: String(e), variant: "destructive" }),
                        });
                      }}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              ) : (
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Não é possível excluir</AlertDialogTitle>
                    <AlertDialogDescription>
                      Este objetivo possui itens vinculados ({hasKRs ? "Key Results" : ""}{hasChildren ? (hasKRs ? ", " : "") + "objetivos filhos" : ""}{collaborators.length > 0 ? ", colaboradores" : ""}{links.length > 0 ? ", links" : ""}). Remova-os antes de excluir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Entendi</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              )}
            </AlertDialog>
          )}
        </div>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle className="text-base">Progresso geral</CardTitle></CardHeader>
        <CardContent>
          {obj.description && <p className="text-sm text-muted-foreground mb-3">{obj.description}</p>}
          <ProgressBar value={obj.progress} status={obj.status} showLabel />
        </CardContent>
      </Card>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Colaboradores</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {collaborators.map((c) => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.user_name} — {c.role === "editor" ? "Editor" : "Visualizador"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {links.length > 0 && (
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Links</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {links.map((l) => {
                const linkedId = l.from_id === id ? l.to_id : l.from_id;
                return (
                  <div key={l.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-2xs">{l.link_type}</Badge>
                    <Link to={`/objectives/${linkedId}`} className="hover:underline text-primary">
                      {linkedId}
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCycleLocked && activeApproval && activeApprovalCr && (
        <div className="rounded-[calc(var(--radius)-4px)] border border-success/30 bg-success/10 p-3 flex items-center gap-2 text-sm text-success">
          <Unlock className="h-4 w-4" />
          Edição temporária aprovada — expira em {formatDistanceToNow(new Date(activeApprovalCr.expires_at!), { locale: ptBR })}.
        </div>
      )}

      {isCycleLocked && !activeApproval && (
        <div className="rounded-[calc(var(--radius)-4px)] border border-warning/30 bg-warning/10 p-3 flex items-center gap-2 text-sm text-warning">
          <Lock className="h-4 w-4" />
          Ciclo travado — solicite um change request para alterações.
        </div>
      )}

      {/* Weight Distributor */}
      {canEditObj && keyResults.length >= 2 && (
        <WeightDistributor
          keyResults={keyResults}
          onUpdateWeight={handleWeightUpdate}
          isPending={updateKeyResult.isPending}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Key Results</h2>
            {keyResults.length > 0 && (() => {
              const totalWeight = keyResults.reduce((s, kr) => s + (kr.weight ?? 1), 0);
              return (
                <p className={`text-xs mt-0.5 ${Math.abs(totalWeight - 100) < 0.01 ? 'text-muted-foreground' : 'text-warning'}`}>
                  Soma dos pesos: {totalWeight}%{Math.abs(totalWeight - 100) >= 0.01 ? ' ⚠️ diferente de 100%' : ''}
                </p>
              );
            })()}
          </div>
          {canEditObj && (
            <Button variant="cta" size="sm" onClick={() => setKrFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Novo KR
            </Button>
          )}
        </div>

        {krsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : keyResults.length === 0 ? (
          <div className="card-elevated p-6 text-center">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum Key Result cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {keyResults.map((kr) => (
              <KeyResultCard
                key={kr.id}
                kr={kr}
                onUpdateProgress={handleProgressUpdate}
                onEdit={canEditKr(kr) ? (kr) => setEditingKr(kr) : undefined}
                onDelete={isPrivileged ? (id) => {
                  deleteKeyResult.mutate(id, {
                    onSuccess: () => toast({ title: "Key Result excluído" }),
                    onError: (e: Error) => toast({ title: "Erro ao excluir", description: String(e), variant: "destructive" }),
                  });
                } : undefined}
                canEdit={canEditKr(kr)}
                canCheckin={canCheckinKr(kr)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Change Requests */}
      {isCycleLocked && obj?.cycle_id && (
        <ChangeRequestCard cycleId={obj.cycle_id} objectiveId={id} showCreateButton={!activeApproval} />
      )}

      <KeyResultForm
        open={krFormOpen}
        onOpenChange={setKrFormOpen}
        onSubmit={handleCreateKr}
        isPending={createKeyResult.isPending}
        existingWeights={getExistingWeights()}
      />

      {editingKr && (
        <KeyResultForm
          open={!!editingKr}
          onOpenChange={(open) => !open && setEditingKr(null)}
          onSubmit={handleUpdateKr}
          defaultValues={editingKr}
          isPending={updateKeyResult.isPending}
          existingWeights={getExistingWeights(editingKr.id)}
        />
      )}

      {editObjOpen && obj && (
        <ObjectiveForm
          open={editObjOpen}
          onOpenChange={setEditObjOpen}
          onSubmit={(values) => {
            updateObjective.mutate(
              { id: obj.id, ...values, parent_objective_id: values.parent_objective_id || null },
              {
                onSuccess: () => {
                  setEditObjOpen(false);
                  objectiveQuery.refetch();
                  toast({ title: "Objetivo atualizado" });
                },
                onError: (e) => toast({ title: "Erro", description: String(e), variant: "destructive" }),
              }
            );
          }}
          defaultValues={obj}
          isPending={updateObjective.isPending}
          objectives={siblingObjectives}
        />
      )}
    </div>
  );
}
