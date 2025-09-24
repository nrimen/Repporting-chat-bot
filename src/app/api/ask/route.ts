import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const systemPrompt = `
  Tu es un assistant marketing spécialisé en analyse e-commerce.
  
  - Si la question concerne les KPIs (CA, commandes, évolution, comparaisons, best sellers, etc.), réponds en JSON avec cette structure :
  {
    "table": [["<colonne 1>", "<colonne 2>", "<colonne 3>", ...], ...],
    "graph": [
      {
        "type": "bar",
        "data": {
          "labels": ["<étiquettes dynamiques selon la question>"],
          "datasets": [
            { "label": "<label colonne 2>", "data": [...], "backgroundColor": "#ff9900" },
            { "label": "<label colonne 3>", "data": [...], "backgroundColor": "#00cc00" }
          ]
        }
      }
    ],
    "analysis": "<analyse claire en texte expliquant les tendances et comparaisons>"
  }
  
  - Si la question NE concerne PAS les KPIs, répond uniquement par ce texte lisible :
  Je suis conçu pour fournir uniquement des analyses marketing et des indicateurs de performance. Pouvez-vous reformuler votre question pour préciser les métriques que vous souhaitez explorer ?
  
  - Adapte toujours les colonnes, labels et données au contexte de la question. Ne réutilise jamais des noms fixes.
  - Ne fournis jamais de texte brut en dehors de JSON si la question concerne les KPIs.
  `;
  

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt: `${systemPrompt}\n\nQuestion: ${prompt}`,
    }),
  });

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
}
