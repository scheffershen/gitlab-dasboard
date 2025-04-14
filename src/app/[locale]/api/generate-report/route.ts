import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { marked } from 'marked';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { date, commits } = await request.json();

    const prompt = `En tant qu'expert en développement logiciel, génère uniquement un résumé général des changements en français pour le ${date}. 
    Voici les commits effectués ce jour-là :

    ${commits.map((commit: any) => `
    Projet: ${commit.project}
    Auteur: ${commit.author}
    Titre: ${commit.title}
    Message: ${commit.message}
    `).join('\n')}

    Format le résumé de manière professionnelle et concise, en mettant l'accent sur les changements les plus importants et leur impact.
    Le résumé doit être clair et facilement compréhensible, même pour des non-techniciens.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en développement logiciel qui génère des résumés clairs et concis en français."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const markdownReport = completion.choices[0].message.content;
    const htmlReport = marked(markdownReport || '');

    return NextResponse.json({ report: htmlReport });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 