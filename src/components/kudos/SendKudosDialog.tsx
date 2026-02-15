import { useState } from "react";
import { useKudos } from "@/hooks/useKudos";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Award } from "lucide-react";

const categories = [
  { value: "general", label: "Geral" },
  { value: "teamwork", label: "Trabalho em Equipe" },
  { value: "innovation", label: "Inovação" },
  { value: "results", label: "Resultados" },
];

export function SendKudosDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toUserId, setToUserId] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const { user } = useAuth();
  const { sendKudos } = useKudos();
  const { data: profiles } = useProfiles();

  const otherProfiles = (profiles ?? []).filter((p) => p.id !== user?.id);

  const handleSubmit = async () => {
    if (!toUserId || !message.trim()) {
      toast({ title: "Selecione um destinatário e escreva uma mensagem", variant: "destructive" });
      return;
    }
    try {
      await sendKudos.mutateAsync({ to_user_id: toUserId, message, category });
      toast({ title: "Kudos enviado! 🎉" });
      setOpen(false);
      setToUserId("");
      setMessage("");
      setCategory("general");
    } catch {
      toast({ title: "Erro ao enviar kudos", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Award className="h-4 w-4" />
            Dar Parabéns
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            Enviar Kudos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Para quem?</label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um colega" />
              </SelectTrigger>
              <SelectContent>
                {otherProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Mensagem</label>
            <Textarea
              placeholder="Escreva sua mensagem de reconhecimento..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={sendKudos.isPending} className="gap-2">
            <Award className="h-4 w-4" />
            Enviar Kudos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
