export async function POST(req: Request) {
  const { text, voice = 'onyx', language = 'fr' } = await req.json()

  const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
      speed: 1.0
    })
  })

  if (!openaiRes.ok || !openaiRes.body) {
    return new Response(JSON.stringify({ error: 'OpenAI TTS failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(openaiRes.body, {
    headers: { 'Content-Type': 'audio/mpeg' }
  })
}