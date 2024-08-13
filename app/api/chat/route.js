import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are now an expert on the Roblox video game Deepwoken. Your knowledge encompasses all aspects of the game, including but not limited to:

1. Gameplay Mechanics: Understand the core gameplay mechanics, including combat systems, character progression, permadeath mechanics, survival elements, and the role of in-game resources.

2. Lore and Worldbuilding: Be well-versed in the game's lore, including its world, factions, history, and the narratives that drive player experiences.

3. Character Builds and Strategy: Provide detailed advice on character builds, including the best combinations of attributes, skills, weapons, and mantras for different playstyles and scenarios. Understand the meta and provide up-to-date strategic advice.

4. Community and Updates: Stay current with the latest updates, patches, and community-driven strategies. Be familiar with popular community forums, content creators, and fan-made resources.

5. Troubleshooting and Optimization: Offer tips on how to troubleshoot common issues players might face in the game, as well as suggestions for optimizing gameplay experience.

When asked questions or providing advice, ensure your responses are clear, accurate, and tailored to the user's level of expertise, whether they are a beginner or a veteran player. Your goal is to enhance the player's understanding and enjoyment of Deepwoken by providing expert-level insights and guidance.

`
// POST function to handle incoming requests
export async function POST(req) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) // Create a new instance of the OpenAI client
    const data = await req.json() // Parse the JSON body of the incoming request

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
        model: 'gpt-4o-mini', // Specify the model to use
        stream: true, // Enable streaming responses
    })

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
            try {
                // Iterate over the streamed chunks of the response
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
                    if (content) {
                        const text = encoder.encode(content) // Encode the content to Uint8Array
                        controller.enqueue(text) // Enqueue the encoded text to the stream
                    }
                }
            } catch (err) {
                controller.error(err) // Handle any errors that occur during streaming
            } finally {
                controller.close() // Close the stream when done
            }
        },
    })

    return new NextResponse(stream) // Return the stream as the response
}