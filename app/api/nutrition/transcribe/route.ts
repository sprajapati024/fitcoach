import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB as per Whisper API limit)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size is 25MB" },
        { status: 400 }
      );
    }

    // Validate file type (check base type, ignoring codec parameters)
    const validTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/m4a",
      "audio/ogg",
    ];
    const baseType = audioFile.type.split(";")[0]; // Remove codec parameters
    if (!validTypes.includes(baseType)) {
      return NextResponse.json(
        {
          error: `Invalid audio format. Supported formats: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Log audio file details for debugging
    console.log(`Transcribing audio: ${audioFile.name}, type: ${audioFile.type}, size: ${audioFile.size} bytes`);

    // Call OpenAI Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // Can be changed to support multiple languages
      response_format: "json",
      // Removed prompt to avoid confusion - let Whisper transcribe naturally
    });

    // Calculate approximate duration (rough estimate based on file size)
    // More accurate duration would require parsing the audio file
    const estimatedDuration = audioFile.size / 16000; // Rough estimate in seconds

    console.log(`Transcription successful: "${transcription.text.substring(0, 100)}..."`);

    return NextResponse.json({
      transcript: transcription.text,
      duration: estimatedDuration,
    });
  } catch (error: unknown) {
    console.error("Transcription error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
