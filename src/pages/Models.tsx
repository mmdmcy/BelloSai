import React from 'react';
import { AVAILABLE_MODELS } from '../models/registry';

export default function Models() {
  const groqModels = AVAILABLE_MODELS.filter(m => m.provider === 'Groq');

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Models</h1>

      <p className="mb-8 text-gray-600">
        We currently use Groq as our provider for the following models. Set your `GROQ_API_KEY` in Supabase project secrets.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groqModels.map((m) => (
          <div key={m.code} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{m.name}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Groq</span>
            </div>
            <div className="mt-1 text-sm text-gray-500">ID: {m.code}</div>
            {m.description && <p className="mt-3 text-sm">{m.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {m.capabilities.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {c}
                </span>
              ))}
            </div>
            {m.code === 'openai/gpt-oss-20b' && (
              <ul className="mt-3 text-sm list-disc list-inside text-gray-700">
                <li>Context: 131,072 tokens; Max output: 65,536</li>
                <li>MoE 20B (3.6B active), ~1000 tokens/sec</li>
                <li>Strong coding/reasoning; tool use and function calling</li>
              </ul>
            )}
            {m.code === 'openai/gpt-oss-120b' && (
              <ul className="mt-3 text-sm list-disc list-inside text-gray-700">
                <li>Context: 131,072 tokens; Max output: 65,536</li>
                <li>MoE 120B (5.1B active), ~500 tokens/sec</li>
                <li>Frontier-grade reasoning, math/coding benchmarks</li>
              </ul>
            )}
            {m.code === 'llama-3.3-70b-versatile' && (
              <ul className="mt-3 text-sm list-disc list-inside text-gray-700">
                <li>Context: 131,072 tokens; Max output: 32,768</li>
              </ul>
            )}
            {m.code === 'llama-3.1-8b-instant' && (
              <ul className="mt-3 text-sm list-disc list-inside text-gray-700">
                <li>Context: 131,072 tokens; Max output: 131,072</li>
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


