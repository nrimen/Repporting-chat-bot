import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser, StringOutputParser } from "@langchain/core/output_parsers"; // <-- AJOUT DE StringOutputParser

export async function POST(req: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return new Response("GROQ_API_KEY is not set in environment variables.", {
        status: 500,
      });
    }

    const { prompt: userInput } = await req.json();

    if (!userInput) {
      return new Response("Missing prompt", { status: 400 });
    }

    // Définition du schéma JSON complet (NÉCESSAIRE pour response_format)
    const jsonSchema = {
      type: "object",
      properties: {
        table: {
          type: "array",
          description: "A 2D array representing the table data (including headers).",
          items: { type: "array" },
        },
        graph: {
          type: "array",
          description: "An array of graph objects.",
          items: {
            type: "object",
            properties: {
              type: { type: "string", description: "The type of chart: 'bar' or 'line'." },
              data: {
                type: "object",
                properties: {
                  labels: { type: "array", items: { type: "string" }, description: "Dynamic labels for the X-axis." },
                  datasets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        data: { type: "array", items: { type: "number" } },
                        backgroundColor: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        analysis: { type: "string", description: "A clear textual analysis explaining trends and comparisons." },
        suggestions: { type: "array", items: { type: "string" }, description: "3 relevant follow-up questions." },
      },
      required: ["table", "graph", "analysis", "suggestions"],
    };


    const escapedJsonExample = `
      {{
        "table": [["<Dynamic Header 1>", "<Dynamic Header 2>", "..."], ["<Value A>", "<Value B>", "..."], ...],
        "graph": [
          {{ 
            "type": "bar",
            "data": {{ 
              "labels": ["<Label 1>", "<Label 2>", "<Label N>"], 
              "datasets": [
                {{ "label": "<Metric 1 Label>", "data": [100, 200, 300], "backgroundColor": "#ff9900" }},
                {{ "label": "<Metric 2 Label>", "data": [50, 150, 250], "backgroundColor": "#00cc00" }} 
              ]
            }} 
          }} 
        ],
        "analysis": "<OBLIGATOIRE : Analyse claire et dynamique basée sur les données générées.>",
        "suggestions": ["<Dynamic Follow-up Q1>", "<Dynamic Follow-up Q2>", "<Dynamic Follow-up Q3>"]
      }}
    `;
    
    const systemPrompt = `
      Tu es un assistant marketing spécialisé en analyse e-commerce.
      
      RÈGLE D'OR: Ta réponse DOIT être UNIQUEMENT une chaîne JSON. **NE PAS inclure de texte explicatif, de balises (comme <think>), ou de préambule avant le JSON.**
      
      - RÉPONSE JSON OBLIGATOIRE: Si la question concerne les KPIs (CA, commandes, évolution, comparaisons, best sellers, etc.), tu DOIS répondre UNIQUEMENT en JSON. 
      
      - **CRITIQUE :** Les en-têtes de tableau, les labels des graphiques et les données doivent être générés dynamiquement pour correspondre à la requête de l'utilisateur.
      
      - RÈGLE CLÉ : Si aucun KPI n'est spécifié dans une demande de comparaison ou d'évolution (ex: "compare 2 periodes "), assume les KPI par défaut (CA et Commandes) et génère le JSON.
      
      - La structure JSON que tu dois générer est définie par le schéma fourni dans ta configuration. Elle DOIT OBLIGATOIREMENT contenir les clés "table", "graph", "analysis" et "suggestions" et respecter ce format échappé : ${escapedJsonExample}
      
      - APPLIQUE TOUJOURS CETTE RÈGLE POUR LES SUGGESTIONS: Fournis 3 suggestions de questions pertinentes. Si aucune n'est pertinente, laisse l'array vide: "suggestions": [].

      - Si la question NE concerne PAS les KPIs, réponds UNIQUEMENT par le texte lisible suivant (et seulement ce texte, sans JSON) :
      Je suis conçu pour fournir uniquement des analyses marketing et des indicateurs de performance. Pouvez-vous reformuler votre question pour préciser les métriques que vous souhaitez explorer ?
      
      - Adapte toujours les colonnes, labels et données au contexte de la question. Ne réutilise jamais des noms fixes.
    `;


    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "{input}"],
    ]);

    const jsonParser = new JsonOutputParser();
    const stringParser = new StringOutputParser(); 

    const model = new ChatGroq({
      apiKey: groqApiKey,
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0,
      response_format: {
        type: "json_object",
        json_schema: jsonSchema, 
      },
    } as any); 

    const rawResponseText = await promptTemplate.pipe(model).pipe(stringParser).invoke({ input: userInput });

    let cleanedJsonText = rawResponseText.trim();
    
    if (cleanedJsonText.startsWith("Je suis conçu")) {
        return new Response(JSON.stringify({ response: cleanedJsonText }), {
           headers: { "Content-Type": "application/json" },
        });
    }

    const jsonStart = cleanedJsonText.indexOf('{');
    const jsonEnd = cleanedJsonText.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedJsonText = cleanedJsonText.substring(jsonStart, jsonEnd + 1);
    } else {
        console.error("Failed to find valid JSON markers in output:", rawResponseText.substring(0, 100));
        throw new Error(`Model output did not contain a recognizable JSON structure. Response starts with: ${rawResponseText.substring(0, 50)}...`);
    }
    
    const rawResponse = await jsonParser.parse(cleanedJsonText);
    
    const fullResponseText = JSON.stringify(rawResponse);

    return new Response(JSON.stringify({ response: fullResponseText }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Groq/LangChain Error:", error);
    return new Response(
      `An error occurred: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}