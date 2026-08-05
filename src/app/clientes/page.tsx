"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Cliente, Veiculo } from "@/lib/types";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculosPorCliente, setVeiculosPorCliente] = useState<Record<string, Veiculo[]>>({});
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [placa, setPlaca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    const { data: clientesData } = await supabase.from("clientes").select("*").order("nome");
    setClientes(clientesData ?? []);

    const { data: veiculosData } = await supabase.from("veiculos").select("*");
    const agrupado: Record<string, Veiculo[]> = {};
    for (const v of veiculosData ?? []) {
      agrupado[v.cliente_id] = [...(agrupado[v.cliente_id] ?? []), v];
    }
    setVeiculosPorCliente(agrupado);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o Supabase ao montar
    carregar();
  }, []);

  async function adicionarCliente(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) return;
    const { error } = await supabase
      .from("clientes")
      .insert({ nome, telefone, cpf_cnpj: cpfCnpj || null });
    if (error) {
      setErro(error.message);
      return;
    }
    setNome("");
    setTelefone("");
    setCpfCnpj("");
    carregar();
  }

  async function adicionarVeiculo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!clienteSelecionado || !placa.trim()) return;
    const { error } = await supabase
      .from("veiculos")
      .insert({ cliente_id: clienteSelecionado, placa: placa.toUpperCase() });
    if (error) {
      setErro(error.message);
      return;
    }
    setPlaca("");
    carregar();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Clientes</h1>

      <form onSubmit={adicionarCliente} className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <input
          className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
          placeholder="Nome do cliente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <input
          className="flex-1 min-w-[150px] rounded-lg bg-slate-800 px-3 py-2"
          placeholder="CPF/CNPJ (p/ assinatura recorrente)"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
        />
        <button className="rounded-lg bg-[#029cd9] px-4 py-2 font-medium text-white">
          Adicionar
        </button>
        {erro && <p className="w-full text-sm text-red-400">{erro}</p>}
      </form>

      <div className="space-y-3">
        {clientes.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.nome}</p>
                <p className="text-sm text-slate-400">{c.telefone}</p>
              </div>
              <button
                onClick={() => setClienteSelecionado(clienteSelecionado === c.id ? null : c.id)}
                className="text-sm text-[#029cd9]"
              >
                + Veículo
              </button>
            </div>

            <ul className="mt-2 flex flex-wrap gap-2">
              {(veiculosPorCliente[c.id] ?? []).map((v) => (
                <li key={v.id} className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                  {v.placa}
                </li>
              ))}
            </ul>

            {clienteSelecionado === c.id && (
              <form onSubmit={adicionarVeiculo} className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                />
                <button className="rounded-lg bg-[#029cd9] px-3 py-2 text-sm font-medium text-white">
                  Salvar
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
