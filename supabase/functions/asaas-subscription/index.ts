import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: apiKey } = await supabase.rpc("obter_segredo", { nome_segredo: "asaas_api_key" });
    if (!apiKey) {
      throw new Error("Chave da Asaas não configurada");
    }

    const body = await req.json();
    const { assinaturaId } = body as { assinaturaId: string };
    if (!assinaturaId) {
      return new Response(JSON.stringify({ error: "assinaturaId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { data: assinatura, error: assinaturaErro } = await supabase
      .from("assinaturas")
      .select("id, cliente_id, plano_id, asaas_subscription_id")
      .eq("id", assinaturaId)
      .single();
    if (assinaturaErro || !assinatura) {
      throw new Error("Assinatura não encontrada");
    }

    if (assinatura.asaas_subscription_id) {
      return new Response(JSON.stringify({ error: "Assinatura já está integrada com a Asaas" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, nome, telefone, email, cpf_cnpj, asaas_customer_id")
      .eq("id", assinatura.cliente_id)
      .single();
    const { data: plano } = await supabase
      .from("planos")
      .select("id, nome, preco_mensal")
      .eq("id", assinatura.plano_id)
      .single();

    if (!cliente || !plano) {
      throw new Error("Cliente ou plano não encontrado");
    }
    if (!cliente.cpf_cnpj) {
      return new Response(
        JSON.stringify({ error: "Cadastre o CPF/CNPJ do cliente antes de criar a assinatura recorrente" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    let asaasCustomerId = cliente.asaas_customer_id as string | null;

    if (!asaasCustomerId) {
      const customerRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: apiKey },
        body: JSON.stringify({
          name: cliente.nome,
          cpfCnpj: cliente.cpf_cnpj,
          email: cliente.email ?? undefined,
          mobilePhone: cliente.telefone ?? undefined,
          externalReference: cliente.id,
        }),
      });
      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        throw new Error(customerData.errors?.[0]?.description ?? "Erro ao criar cliente na Asaas");
      }
      asaasCustomerId = customerData.id;
      await supabase.from("clientes").update({ asaas_customer_id: asaasCustomerId }).eq("id", cliente.id);
    }

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const subscriptionRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "UNDEFINED",
        value: Number(plano.preco_mensal),
        nextDueDate: amanha.toISOString().slice(0, 10),
        cycle: "MONTHLY",
        description: `Flip Wash - ${plano.nome}`,
        externalReference: assinatura.id,
      }),
    });
    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      throw new Error(subscriptionData.errors?.[0]?.description ?? "Erro ao criar assinatura na Asaas");
    }

    await supabase
      .from("assinaturas")
      .update({ asaas_subscription_id: subscriptionData.id })
      .eq("id", assinatura.id);

    const paymentsRes = await fetch(
      `${ASAAS_BASE_URL}/payments?subscription=${subscriptionData.id}`,
      { headers: { access_token: apiKey } }
    );
    const paymentsData = await paymentsRes.json();
    const primeiraCobranca = paymentsData.data?.[0];

    let linkPagamento: string | null = null;
    if (primeiraCobranca) {
      linkPagamento = primeiraCobranca.invoiceUrl ?? null;
      await supabase.from("cobrancas").insert({
        assinatura_id: assinatura.id,
        gateway: "asaas",
        gateway_cobranca_id: primeiraCobranca.id,
        valor: primeiraCobranca.value,
        status: "pendente",
        vencimento: primeiraCobranca.dueDate,
        invoice_url: linkPagamento,
      });
    }

    return new Response(
      JSON.stringify({ subscriptionId: subscriptionData.id, linkPagamento }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
