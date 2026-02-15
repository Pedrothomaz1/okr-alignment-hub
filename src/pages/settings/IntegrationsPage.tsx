import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Link2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "veri_slack_config";

interface SlackConfig {
  webhook_url: string;
  notify_checkin: boolean;
  notify_kr_done: boolean;
  notify_kudos: boolean;
  notify_cycle: boolean;
}

const defaultConfig: SlackConfig = {
  webhook_url: "",
  notify_checkin: true,
  notify_kr_done: true,
  notify_kudos: true,
  notify_cycle: true,
};

export default function IntegrationsPage() {
  const [config, setConfig] = useState<SlackConfig>(defaultConfig);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const save = (updated: SlackConfig) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast({ title: "Configurações salvas" });
  };

  const testWebhook = async () => {
    if (!config.webhook_url) {
      toast({ title: "Insira a URL do webhook primeiro", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("slack-notify", {
        body: {
          webhook_url: config.webhook_url,
          event_type: "Teste",
          message: "🔔 Teste de integração Veri OKR — funcionando!",
        },
      });
      if (error) throw error;
      toast({ title: "Mensagem de teste enviada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar teste", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Integrações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure integrações externas para o seu workspace.
        </p>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="currentColor"/>
            </svg>
            Slack
          </CardTitle>
          <CardDescription>
            Envie notificações automáticas para um canal do Slack via webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={config.webhook_url}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Crie um webhook em{" "}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                api.slack.com/messaging/webhooks
              </a>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Tipos de Notificação</Label>
            {[
              { key: "notify_checkin" as const, label: "Novos check-ins" },
              { key: "notify_kr_done" as const, label: "KR concluído" },
              { key: "notify_kudos" as const, label: "Kudos recebido" },
              { key: "notify_cycle" as const, label: "Ciclo ativado/encerrado" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={config[item.key]}
                  onCheckedChange={(v) => setConfig({ ...config, [item.key]: v })}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => save(config)} className="flex-1">
              Salvar
            </Button>
            <Button variant="outline" onClick={testWebhook} disabled={testing || !config.webhook_url}>
              <Send className="h-4 w-4 mr-2" />
              {testing ? "Enviando..." : "Testar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
