import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, message, changes } = await req.json();

    const prompt = `As a senior developer, analyze this git commit:
Title: ${title}
Message: ${message}
Changes: ${changes} files modified

Rate this commit and suggest improvements, considering:
1. Commit message clarity and completeness
2. Size and scope of changes
3. Following git commit best practices
4. Potential impact and risks

Provide a better commit message in French, following the conventional commits format (feat, fix, docs, style, refactor, test, chore).
The commit message should be professional and clear in French, using HTML formatting for better readability.
Use <h2> tags for the type and scope, and <ul>/<li> for details.

Format your response as JSON:
{
  "score": number,
  "analysis": "detailed explanation in French",
  "betterCommitMessage": "suggested commit message in French using conventional commits format with HTML tags (<h2>, <ul>, <li>, <p>)",
  "explanation": "explanation in French of why this commit message is better"
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    return NextResponse.json(JSON.parse(response));
  } catch (error) {
    console.error('Error analyzing commit:', error);
    return NextResponse.json(
      { error: 'Failed to analyze commit' },
      { status: 500 }
    );
  }
} 