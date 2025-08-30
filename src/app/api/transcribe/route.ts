import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const uploadDir = path.join(process.cwd(), "uploads");
const transcriptDir = path.join(process.cwd(), "transcripts");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.mkdirSync(transcriptDir, { recursive: true });

    const timestamp = Date.now();
    const audioPath = path.join(uploadDir, `${timestamp}-${file.name}`);
    const transcriptPath = path.join(transcriptDir, `${timestamp}.txt`);

    const arrayBuffer = await file.arrayBuffer();
    await fs.promises.writeFile(audioPath, Buffer.from(arrayBuffer));

    return new Promise((resolve) => {
      exec(`whisper "${audioPath}" --model small --output_dir "${transcriptDir}" --output_format txt`, (error) => {
        if (error) {
          console.error(error);
          resolve(NextResponse.json({ error: "Transcription failed" }, { status: 500 }));
        } else {
          const transcript = fs.readFileSync(transcriptPath, "utf8").trim();
          resolve(NextResponse.json({ text: transcript }));
        }
      });
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
