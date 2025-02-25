const fs = require("fs")
const path = require("path")
const vosk = require("vosk")
require('dotenv').config()
const ffmpeg = require("fluent-ffmpeg")


const modelPathEnv = process.env.MODEL_PATH || "models/pl/vosk-model-small-pl-0.22"
const MODEL_PATH = path.isAbsolute(modelPathEnv) ? modelPathEnv : path.join(__dirname, modelPathEnv)
console.log("MODEL_PATH:", MODEL_PATH)

const MP3_FILE = path.join(__dirname, process.env.MP3_FILE)
const WAV_FILE = path.join(__dirname, process.env.WAV_FILE)

if (!fs.existsSync(MODEL_PATH)) {
  console.error("Erroe: PL Model not found")
  process.exit(1)
}

vosk.setLogLevel(0)
const model = new vosk.Model(MODEL_PATH)

async function transcribeAudio(filePath) {
  return new Promise((resolve, reject) => {
    const rec = new vosk.Recognizer({ model, sampleRate: 16000 })
    const stream = fs.createReadStream(filePath, { highWaterMark: 4096 })

    stream.on("data", (chunk) => rec.acceptWaveform(chunk))
    stream.on("end", () => {
      const result = rec.finalResult()
      rec.free()
      resolve(result.text)
    })
    stream.on("error", reject)
  })
}

async function convertToWav(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .output(outputFile)
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .on("end", () => resolve(outputFile))
      .on("error", reject)
      .run()
  })
}

async function main() {
  try {
    console.log("🎤 Begin recognize process...")
    await convertToWav(MP3_FILE, WAV_FILE)
    const transcript = await transcribeAudio(WAV_FILE)
    console.log("📜 Recognized text:", transcript)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
