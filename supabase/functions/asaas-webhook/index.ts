import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const EVENTOS_RECUSADO = new Set(["PAYMENT_OVERDUE", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"]);
const EVENTOS_CANCELADO = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenEsperado } = await supabase.rpc("obter_segredo", {
      nome_segredo: "asaas_webhook_token",
    });
    const tokenRecebido = req.headers.get("asaas-access-token");
    if (tokenEsperado && tokenRecebido !== tokenEsperado) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });
    }

    const payload = await req.json();
    const evento = payload.event as string;
    const payment = payload.payment;
    if (!payment?.id) {
      return new Response(JSON.stringify({ ok: true, ignorado: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let novoStatus: "pendente" | "pago" | "recusado" | "cancelado" = "pendente";
    if (EVENTOS_PAGO.has(evento)) novoStatus = "pago";
    else if (EVENTOS_RECUSADO.has(evento)) novoStatus = "recusado";
    else if (EVENTOS_CANCELADO.has(evento)) novoStatus = "cancelado";

    const { data: existente } = await supabase
      .from("cobrancas")
      .select("id, assinatura_id")
      .eq("gateway", "asaas")
      .eq("gateway_cobranca_id", payment.id)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("cobrancas")
        .update({
          status: novoStatus,
          pago_em: novoStatus === "pago" ? payment.clientPaymentDate ?? new Date().toISOString() : null,
          invoice_url: payment.invoiceUrl ?? undefined,
        })
        .eq("id", existente.id);
    } else if (payment.subscription) {
      const { data: assinatura } = await supabase
        .from("assinaturas")
        .select("id")
        .eq("asaas_subscription_id", payment.subscription)
        .maybeSingle();

      if (assinatura) {
        await supabase.from("cobrancas").insert({
          assinatura_id: assinatura.id,
          gateway: "asaas",
          gateway_cobranca_id: payment.id,
          valor: payment.value,
          status: novoStatus,
          vencimento: payment.dueDate,
          pago_em: novoStatus === "pago" ? payment.clientPaymentDate ?? new Date().toISOString() : null,
          invoice_url: payment.invoiceUrl ?? null,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
