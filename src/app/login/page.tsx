"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome } },
          });

    setLoading(false);

    if (result.error) {
      setErro(result.error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:grid lg:grid-cols-2">
      <CarWashHero />

      <div className="flex min-h-screen items-center justify-center p-4 lg:min-h-0">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="lg:hidden">
            <MiniCarBadge />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white">Flip Wash</h1>
            <p className="text-sm text-slate-400">
              {mode === "login" ? "Entrar no sistema" : "Criar conta"}
            </p>
          </div>

          {mode === "signup" && (
            <input
              className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          )}
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg bg-slate-800 px-3 py-2 outline-none"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            required
          />

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-sm text-slate-400"
          >
            {mode === "login" ? "Criar uma conta nova" : "Já tenho conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CarWashHero() {
  return (
    <div className="relative hidden overflow-hidden border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black lg:flex lg:flex-col lg:justify-between lg:p-10">
      {/* Bolhas de sabão flutuando */}
      <div className="pointer-events-none absolute inset-0">
        {SUDS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full border border-white/10 bg-white/5"
            style={{
              width: s.size,
              height: s.size,
              left: s.left,
              top: s.top,
              animation: `flip-wash-float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <span className="text-lg font-semibold tracking-wide text-white">FLIP WASH</span>
        <p className="mt-1 text-sm text-slate-400">Premium Barbearia · Lava-Jato</p>
      </div>

      <div className="relative z-10 -mb-4">
        <p className="mb-6 max-w-xs text-2xl font-semibold leading-snug text-white">
          Gestão completa do seu lava-jato, do agendamento ao caixa.
        </p>
        <CarIllustration />
        {/* Linha da água / piso molhado */}
        <div className="mt-2 h-2 w-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent blur-[2px]" />
        <div className="mt-1 flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-white/40"
              style={{ animation: `flip-wash-drop 1.6s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes flip-wash-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-14px) scale(1.08); opacity: 0.9; }
        }
        @keyframes flip-wash-drop {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(3px); }
        }
      `}</style>
    </div>
  );
}

function CarIllustration() {
  return (
    <svg viewBox="0 0 400 160" className="w-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
      {/* respingos de água atrás do carro */}
      <g stroke="white" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round">
        <line x1="30" y1="60" x2="10" y2="50" />
        <line x1="30" y1="80" x2="6" y2="80" />
        <line x1="34" y1="100" x2="12" y2="112" />
        <line x1="370" y1="55" x2="392" y2="44" />
        <line x1="372" y1="80" x2="396" y2="80" />
        <line x1="368" y1="102" x2="388" y2="114" />
      </g>

      {/* corpo do carro */}
      <path
        d="M40 118 C40 100 55 96 75 92 L110 68 C120 60 135 55 150 55 L250 55 C265 55 280 60 290 68 L322 92 C342 96 358 102 360 118 L360 128 C360 133 356 136 351 136 L49 136 C44 136 40 133 40 128 Z"
        fill="white"
      />
      <path
        d="M118 68 L145 58 C150 56 156 55 162 55 L238 55 C246 55 253 57 259 61 L286 78 Z"
        fill="#0f172a"
        opacity="0.85"
      />
      {/* faixa preta lateral */}
      <path d="M40 116 L360 116 L360 122 L40 122 Z" fill="#0f172a" opacity="0.9" />

      {/* rodas */}
      <circle cx="112" cy="132" r="18" fill="#0f172a" />
      <circle cx="112" cy="132" r="8" fill="white" />
      <circle cx="288" cy="132" r="18" fill="#0f172a" />
      <circle cx="288" cy="132" r="8" fill="white" />

      {/* bolhas de espuma sobre o carro */}
      <g fill="white" fillOpacity="0.85">
        <circle cx="150" cy="48" r="5" />
        <circle cx="165" cy="40" r="7" />
        <circle cx="182" cy="46" r="4" />
        <circle cx="205" cy="38" r="6" />
        <circle cx="225" cy="46" r="4" />
        <circle cx="245" cy="40" r="5" />
      </g>
    </svg>
  );
}

function MiniCarBadge() {
  return (
    <div className="mb-2 flex items-center gap-2 text-slate-400">
      <svg viewBox="0 0 48 24" className="h-6 w-12">
        <path
          d="M4 18 C4 14 8 13 12 12 L18 7 C20 5 24 4 27 4 L36 4 C39 4 42 5 44 7 L47 12 C50 13 53 15 53 18"
          fill="none"
        />
        <path
          d="M4 18 C4 14 8 13 12 12 L18 7 C20 5 24 4 27 4 L34 4 C37 4 40 5 42 7 L47 12 C50 13 53 15 53 18 L53 20 C53 21 52 22 51 22 L6 22 C5 22 4 21 4 20 Z"
          fill="currentColor"
        />
        <circle cx="14" cy="21" r="2.4" fill="#0f172a" />
        <circle cx="40" cy="21" r="2.4" fill="#0f172a" />
      </svg>
      <span className="text-xs uppercase tracking-widest">Flip Wash</span>
    </div>
  );
}

const SUDS = [
  { size: 40, left: "8%", top: "12%", duration: 6, delay: 0 },
  { size: 24, left: "22%", top: "28%", duration: 5, delay: 0.6 },
  { size: 60, left: "70%", top: "8%", duration: 7, delay: 0.3 },
  { size: 28, left: "82%", top: "30%", duration: 5.5, delay: 1 },
  { size: 18, left: "60%", top: "18%", duration: 4.5, delay: 0.8 },
  { size: 34, left: "12%", top: "45%", duration: 6.5, delay: 1.2 },
];
