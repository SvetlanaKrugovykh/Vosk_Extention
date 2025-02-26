const fs = require("fs")
const path = require("path")
const vosk = require("vosk")
require('dotenv').config()
const ffmpeg = require("fluent-ffmpeg")

const TEMP_CATALOG = process.env.TEMP_CATALOG
const modelPathEnv = process.env.MODEL_PATH || "models/pl/vosk-model-small-pl-0.22"
const MODEL_PATH = path.isAbsolute(modelPathEnv) ? modelPathEnv : path.join(__dirname, '..', '..', modelPathEnv)
console.log("MODEL_PATH:", MODEL_PATH)

if (!fs.existsSync(MODEL_PATH)) {
  console.error("Erroe: PL Model not found")
  process.exit(1)
}

if (!fs.existsSync(TEMP_CATALOG)) {
  fs.mkdirSync(TEMP_CATALOG, { recursive: true })
}

vosk.setLogLevel(0)
const model = new vosk.Model(MODEL_PATH)


module.exports.doLinkServiceMultipart = async function (relayData) {
  try {
    const { file } = relayData

    if (file) {
      const startTime = Date.now()
      console.log(`${startTime}: Multipart request start`)
      console.log("🎤 Begin recognize process...")

      const mp3FilePath = path.join(TEMP_CATALOG, `${startTime}.mp3`)
      const wavFilePath = path.join(TEMP_CATALOG, `${startTime}.wav`)

      fs.writeFileSync(mp3FilePath, file.buffer)
      await convertToWav(mp3FilePath, wavFilePath)

      const transcript = await transcribeAudio(wavFilePath)
      // fs.unlinkSync(mp3FilePath)
      fs.unlinkSync(wavFilePath)

      console.log("📜 Recognized text:", transcript)
      console.log("🎉 Process finished!")
      return transcript
    }

    return null
  } catch (err) {
    return null
  }
}


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



