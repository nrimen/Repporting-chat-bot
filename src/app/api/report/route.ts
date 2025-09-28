import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq"; 
import { ChatPromptTemplate } from "@langchain/core/prompts"; 
import { AIMessage, MessageContentComplex } from "@langchain/core/messages";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReportConfig {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  clientName?: string;
}

const safeParseContent = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return { analysis: content };
  }
};

async function generateReportTitle(history: Message[]): Promise<string> {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return "Rapport d'Analyse Dilly";

    const chatHistorySummary = history.map(msg => `${msg.role}: ${msg.content.substring(0, 100)}...`).join('\n');

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", "À partir de cet historique de conversation, génère un titre de rapport synthétique et professionnel (max 10 mots). Réponds UNIQUEMENT par le titre."],
        ["user", `Historique de la conversation:\n{chatHistorySummary}`], 
    ]);

    try {
        const model = new ChatGroq({ apiKey: groqApiKey, model: "deepseek-r1-distill-llama-70b", temperature: 0.3 });
        
        const formattedPrompt = await prompt.format({ chatHistorySummary }); 
        const result: AIMessage = await model.invoke(formattedPrompt);
        
        let titleContent = "";

        if (typeof result.content === 'string') {
            titleContent = result.content;
        } else if (Array.isArray(result.content)) {
            titleContent = (result.content as MessageContentComplex[])
                            .map(part => (typeof part === 'string' ? part : part.text || ''))
                            .join(' ');
        }
        
        const cleanedTitle = titleContent.replace(/<think>[\s\S]*?<\/think>/g, ''); 
        return cleanedTitle.trim().replace(/^['"]|['"]$/g, '');

    } catch (e) {
        console.error("Failed to generate title:", e);
        return "Rapport d'Analyse Dilly Personnalisé";
    }
}

const tableToHtmlString = (table: any[], title?: string): string => { 
    if (!Array.isArray(table) || table.length === 0) return "";
    
    let html = `
        <div class="table-container" style="margin: 25px 0; overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            ${title ? `<h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">${title}</h4>` : ''}
            <table style="width: 100%; border-collapse: collapse; background: white; font-size: 11px; min-width: 600px;">
    `;
    
    html += '<thead><tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">';
    table[0].forEach((header: any) => { 
        html += `<th style="
            padding: 15px 12px; 
            color: white; 
            text-align: left; 
            font-weight: 600; 
            font-size: 12px;
            border-right: 1px solid rgba(255,255,255,0.1);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        ">${header}</th>`;
    });
    html += '</tr></thead>';
    
    html += '<tbody>';
    for (let i = 1; i < table.length; i++) {
        const rowBg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
        html += `<tr style="background-color: ${rowBg}; transition: all 0.2s ease;">`;
        table[i].forEach((cell: any, cellIndex: number) => { 
            html += `<td style="
                padding: 12px; 
                border-bottom: 1px solid #e9ecef; 
                border-right: 1px solid #f1f3f4;
                color: #2c3e50;
                ${cellIndex === 0 ? 'font-weight: 500;' : ''}
            ">${cell}</td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    
    return html;
};

const createChartContainer = (imageBase64: string, title?: string): string => {
    return `
        <div class="chart-container" style="
            margin: 30px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        ">
            ${title ? `<h4 style="color: #2c3e50; font-size: 14px; margin: 0 0 20px 0; font-weight: 600;">${title}</h4>` : ''}
            <div style="
                background: white; 
                padding: 15px; 
                border-radius: 8px; 
                display: inline-block; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            ">
                <img src="${imageBase64}" alt="Graphique d'Analyse" style="
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                "/>
            </div>
        </div>
    `;
};

const generateChartFromTable = (table: any[]): string => {
    console.log("Table data:", table);
    
    if (!Array.isArray(table) || table.length < 2) {
        console.log("Invalid table structure");
        return "";
    }
    
    const headers = table[0];
    const rows = table.slice(1);
    
    console.log("Headers:", headers);
    console.log("Rows:", rows);
    
    let hasNumericData = false;
    const numericValues: number[] = [];
    
    rows.forEach((row: any[]) => {
        for (let i = 1; i < row.length; i++) {
            const val = parseFloat(String(row[i]).replace(/[^0-9.-]/g, ''));
            if (!isNaN(val)) {
                hasNumericData = true;
                numericValues.push(val);
            }
        }
    });
    
    console.log("Has numeric data:", hasNumericData);
    console.log("Numeric values:", numericValues);
    
    if (!hasNumericData || headers.length < 2) {
        return `
            <div class="chart-container" style="
                margin: 30px 0; 
                padding: 25px; 
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 12px; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                text-align: center;
            ">
                <h4 style="color: #2c3e50; font-size: 14px; margin: 0 0 20px 0; font-weight: 600;">
                    📊 Données Non Graphiques
                </h4>
                <p style="color: #6c757d; font-size: 12px;">
                    Les données ne contiennent pas de valeurs numériques pour générer un graphique.
                </p>
            </div>
        `;
    }
    
    const labels = rows.map((row: any[]) => String(row[0]));
    const values = rows.map((row: any[]) => {
        const val = parseFloat(String(row[1]).replace(/[^0-9.-]/g, ''));
        return isNaN(val) ? 0 : val;
    });
    
    const maxValue = Math.max(...values);
    const minValue = Math.min(0, Math.min(...values));
    const range = maxValue - minValue || 1;
    
    const barsHtml = values.map((value, i) => {
        const percentage = Math.max(1, ((value - minValue) / range) * 100);
        const color = `hsl(${200 + (i * 30) % 160}, 70%, 50%)`;
        
        return `
            <div style="display: flex; align-items: center; margin: 8px 0; font-size: 11px;">
                <div style="width: 100px; text-align: right; padding-right: 10px; color: #495057; font-weight: 500;">
                    ${labels[i].length > 12 ? labels[i].substring(0, 12) + '...' : labels[i]}
                </div>
                <div style="flex: 1; background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; position: relative;">
                    <div style="
                        width: ${percentage}%; 
                        height: 100%; 
                        background: ${color}; 
                        border-radius: 10px;
                        transition: width 0.5s ease;
                        position: relative;
                    "></div>
                </div>
                <div style="width: 60px; text-align: left; padding-left: 10px; color: #495057; font-weight: 600;">
                    ${value.toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="chart-container" style="
            margin: 30px 0; 
            padding: 25px; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">
            <h4 style="color: #2c3e50; font-size: 14px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
                📊 Visualisation des Données - ${headers[1] || 'Valeurs'}
            </h4>
            <div style="
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                max-width: 600px;
                margin: 0 auto;
            ">
                ${barsHtml}
            </div>
            <p style="text-align: center; color: #6c757d; font-size: 10px; margin-top: 15px;">
                Graphique généré à partir de ${values.length} point(s) de données
            </p>
        </div>
    `;
};

const generateExecutiveSummary = (history: Message[]): string => {
    const userQuestions = history.filter(msg => msg.role === 'user').length;
    const assistantResponses = history.filter(msg => msg.role === 'assistant').length;
    
    return `
        <div class="executive-summary" style="
            margin: 30px 0; 
            padding: 25px; 
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 12px; 
            border-left: 5px solid #ff6b6b;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">
                📊 Résumé Exécutif
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                <div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${userQuestions}</div>
                    <div style="font-size: 12px; color: #2c3e50; margin-top: 5px;">Questions Analysées</div>
                </div>
                <div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${assistantResponses}</div>
                    <div style="font-size: 12px; color: #2c3e50; margin-top: 5px;">Analyses Générées</div>
                </div>
            </div>
        </div>
    `;
};

export async function POST(req: NextRequest) {
  try {
    const { history, config = {} } = await req.json() as { 
        history: Message[], 
        config?: ReportConfig 
    };
    
    if (!Array.isArray(history) || history.length === 0) {
        return NextResponse.json({ error: "Invalid or empty history" }, { status: 400 });
    }

    const {
        companyName = "Dilly Analytics",
        logoUrl = "",
        primaryColor = "#007bff",
        accentColor = "#6c757d",
        clientName = ""
    } = config;

    const reportTitle = await generateReportTitle(history); 
    const generatedDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const executiveSummary = generateExecutiveSummary(history);
    
    let reportContentHtml = executiveSummary;

    history.forEach((msg: Message, index: number) => {
        const parsedContent = safeParseContent(msg.content); 
        
        if (msg.role === 'user') {
            reportContentHtml += `
                <div class="question-section" style="
                    margin: 40px 0 20px 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-radius: 12px; 
                    border-left: 5px solid ${primaryColor};
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                ">
                    <h3 style="
                        color: ${primaryColor}; 
                        font-size: 16px; 
                        margin: 0 0 10px 0; 
                        font-weight: 700;
                    ">
                        Question d'Analyse
                    </h3>
                    <p style="
                        font-size: 13px; 
                        color: #2c3e50; 
                        margin: 0; 
                        line-height: 1.6;
                        font-weight: 500;
                    ">${msg.content}</p>
                </div>
            `;
        } else if (msg.role === 'assistant') {
            reportContentHtml += `
                <div class="analysis-section" style="
                    margin: 20px 0; 
                    padding: 25px; 
                    background: white;
                    border-radius: 12px; 
                    border: 1px solid #e9ecef;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                ">
            `;
            
            if (parsedContent.analysis) {
                reportContentHtml += `
                    <div style="border-left: 4px solid ${accentColor}; padding-left: 20px; margin-bottom: 20px;">
                        <h4 style="
                            color: ${accentColor}; 
                            font-size: 14px; 
                            margin: 0 0 15px 0; 
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            🔍 Analyse Détaillée
                        </h4>
                        <div style="
                            font-size: 13px; 
                            color: #2c3e50; 
                            line-height: 1.7;
                            text-align: justify;
                        ">${parsedContent.analysis.trim()}</div>
                    </div>
                `;
                
                if (parsedContent.image_base64) {
                    reportContentHtml += createChartContainer(parsedContent.image_base64, "📈 Visualisation des Données");
                }

                if (parsedContent.table && Array.isArray(parsedContent.table) && parsedContent.table.length > 0) {
                    reportContentHtml += generateChartFromTable(parsedContent.table);
                    reportContentHtml += tableToHtmlString(parsedContent.table, "📋 Données d'Analyse");
                }
            } else {
                reportContentHtml += `
                    <h4 style="color: ${accentColor}; font-size: 14px; margin: 0 0 10px 0;">🤖 Réponse IA :</h4>
                    <p style="font-size: 13px; line-height: 1.6; color: #2c3e50;">${msg.content}</p>
                `;
            }
            reportContentHtml += `</div>`;
        }
    });
    
    const fullHtmlReport = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * { box-sizing: border-box; }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0;
                padding: 0;
                background: #f8f9fa;
                color: #2c3e50;
            }
            
            .report-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                min-height: 100vh;
            }
            
            @media print {
                .report-container { box-shadow: none; }
                body { background: white; }
            }
            
            @media (max-width: 768px) {
                .report-container { margin: 0; }
                .table-container table { font-size: 10px; }
            }
        </style>
    </head>
    <body>
      <div class="report-container">
        <div id="pdf-content-wrapper" style="padding: 0;">
            <!-- Enhanced Header -->
            <header style="
                background: linear-gradient(135deg, ${primaryColor} 0%, #6610f2 100%);
                color: white; 
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            ">
                <div style="position: relative; z-index: 2;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 20px;">` : ''}
                    <h1 style="
                        font-size: 28px; 
                        margin: 0 0 10px 0; 
                        font-weight: 800;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">${reportTitle}</h1>
                    <div style="
                        background: rgba(255,255,255,0.2); 
                        backdrop-filter: blur(10px);
                        padding: 15px 25px; 
                        border-radius: 25px; 
                        display: inline-block; 
                        margin-top: 15px;
                    ">
                        <p style="margin: 0; font-size: 14px; font-weight: 500;">
                            📅 Généré le ${generatedDate}
                            ${clientName ? ` • 👤 ${clientName}` : ''}
                        </p>
                    </div>
                </div>
                <div style="
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 200px;
                    height: 200px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    z-index: 1;
                "></div>
            </header>

            <!-- Content -->
            <main style="padding: 30px;">
                ${reportContentHtml}
            </main>

            <!-- Enhanced Footer -->
            <footer style="
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                text-align: center; 
                padding: 30px;
                margin-top: 50px;
            ">
                <div style="
                    max-width: 800px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    align-items: center;
                ">
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">
                            ${companyName}
                        </h4>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                            Intelligence Artificielle & Analyse de Données
                        </p>
                    </div>
                    <div style="font-size: 11px; opacity: 0.7;">
                        <p style="margin: 0;">🔒 Document Confidentiel • Usage Interne</p>
                        <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${companyName} - Tous droits réservés</p>
                    </div>
                </div>
            </footer>
        </div>
      </div>
    </body>
    </html>
    `;

    return NextResponse.json({ 
        html: fullHtmlReport,
        title: reportTitle,
        metadata: {
            questionsCount: history.filter(msg => msg.role === 'user').length,
            responsesCount: history.filter(msg => msg.role === 'assistant').length,
            generatedAt: new Date().toISOString(),
            clientName: clientName || null
        }
    });

  } catch (error) {
    console.error("Report Generation Error:", error);
    return NextResponse.json({ 
        error: `Failed to generate report content: ${error instanceof Error ? error.message : "Unknown error"}` 
    }, { status: 500 });
  }
}