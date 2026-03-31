import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Initiative } from "@/hooks/useInitiatives";

interface Props {
  init: Initiative;
  canManage: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  expired: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function InitiativeActions({ canManage, isAdmin, isOwner, expired, onEdit, onDelete }: Props) {
  return (
    <div className="flex gap-1">
      {(canManage || isOwner) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="icon" variant="ghost" disabled={expired} onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          {expired && <TooltipContent>Prazo expirado</TooltipContent>}
        </Tooltip>
      )}
      {isAdmin && (
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}
