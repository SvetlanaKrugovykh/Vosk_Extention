const fs = require("fs")
const path = require("path")
const vosk = require("vosk")
require('dotenv').config()
const ffmpeg = require("fluent-ffmpeg")

const TEMP_CATALOG = process.env.TEMP_CATALOG

const MODELS_CONFIG = {
  'ru': process.env.MODEL_PATH_RU || "models/ru/vosk-model-ru-0.42",
  'uk': process.env.MODEL_PATH_UK || "models/uk/vosk-model-uk-v3",
  'pl': process.env.MODEL_PATH_PL || "models/pl/vosk-model-small-pl-0.22"
}

const models = {}

function loadModels() {
  vosk.setLogLevel(0)

  for (const [lang, modelPathEnv] of Object.entries(MODELS_CONFIG)) {
    const MODEL_PATH = path.isAbsolute(modelPathEnv) ? modelPathEnv : path.join(__dirname, '..', '..', modelPathEnv)
    console.log(`${lang.toUpperCase()} MODEL_PATH:`, MODEL_PATH)

    if (fs.existsSync(MODEL_PATH)) {
      models[lang] = new vosk.Model(MODEL_PATH)
      console.log(`✅ Model ${lang} loaded successfully`)
    } else {
      console.warn(`⚠️  Model ${lang} not found at ${MODEL_PATH}`)
    }
  }

  if (Object.keys(models).length === 0) {
    console.error("❌ No models found")
    process.exit(1)
  }
}

loadModels()

if (!fs.existsSync(TEMP_CATALOG)) {
  fs.mkdirSync(TEMP_CATALOG, { recursive: true })
}

module.exports.doLinkServiceMultipart = async function (relayData) {
  try {
    const { file, language = 'ru' } = relayData

    if (file) {
      const startTime = Date.now()
      console.log(`${startTime}: Multipart request start for language: ${language}`)
      console.log("🎤 Begin recognize process...")

      let fileExtension = '.ogg' // по умолчанию

      if (file.filename) {
        fileExtension = path.extname(file.filename).toLowerCase()
      } else if (file.mimetype) {
        if (file.mimetype.includes('ogg')) fileExtension = '.ogg'
        else if (file.mimetype.includes('mp3')) fileExtension = '.mp3'
        else if (file.mimetype.includes('wav')) fileExtension = '.wav'
        else if (file.mimetype.includes('mp4')) fileExtension = '.mp4'
        else if (file.mimetype.includes('webm')) fileExtension = '.webm'
      }

      const audioFilePath = path.join(TEMP_CATALOG, `${startTime}${fileExtension}`)
      const wavFilePath = path.join(TEMP_CATALOG, `${startTime}.wav`)

      console.log(`📁 Original file type: ${fileExtension}`)
      console.log(`📁 Saving to: ${audioFilePath}`)
      console.log(`📁 Converting to: ${wavFilePath}`)
      console.log(`📋 MIME type: ${file.mimetype || 'unknown'}`)
      console.log(`📋 Filename: ${file.filename || 'unknown'}`)

      fs.writeFileSync(audioFilePath, file.buffer)

      const fileStats = fs.statSync(audioFilePath)
      console.log(`📊 File saved, size: ${fileStats.size} bytes`)

      if (fileStats.size === 0) {
        throw new Error('Saved file is empty')
      }

      await convertToWav(audioFilePath, wavFilePath)

      const transcript = await transcribeAudio(wavFilePath, language)

      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath)
        console.log(`🗑️ Deleted: ${audioFilePath}`)
      }
      if (fs.existsSync(wavFilePath)) {
        fs.unlinkSync(wavFilePath)
        console.log(`🗑️ Deleted: ${wavFilePath}`)
      }

      console.log("📜 Recognized text:", transcript)
      console.log("🎉 Process finished!")
      return transcript
    }

    return null
  } catch (err) {
    console.error("Error in doLinkServiceMultipart:", err.message)
    console.error("Stack trace:", err.stack)
    return null
  }
}

async function transcribeAudio(filePath, language = 'ru') {
  return new Promise((resolve, reject) => {
    const model = models[language]

    if (!model) {
      reject(new Error(`Model for language ${language} not found`))
      return
    }

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
    console.log(`🔄 Converting ${inputFile} to ${outputFile}`)

    // Проверяем, что входной файл существует
    if (!fs.existsSync(inputFile)) {
      reject(new Error(`Input file does not exist: ${inputFile}`))
      return
    }

    ffmpeg(inputFile)
      .output(outputFile)
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .audioCodec('pcm_s16le')
      .on("start", (commandLine) => {
        console.log('🎬 FFmpeg command: ' + commandLine)
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log('🔄 Processing: ' + Math.round(progress.percent) + '% done')
        }
      })
      .on("end", () => {
        console.log('✅ Conversion finished')
        // Проверяем, что выходной файл создался
        if (fs.existsSync(outputFile)) {
          const stats = fs.statSync(outputFile)
          console.log(`📊 WAV file size: ${stats.size} bytes`)
          resolve(outputFile)
        } else {
          reject(new Error('Output WAV file was not created'))
        }
      })
      .on("error", (err) => {
        console.error('❌ FFmpeg error:', err.message)
        if (err.stderr) {
          console.error('❌ FFmpeg stderr:', err.stderr)
        }
        reject(err)
      })
      .run()
  })
}

module.exports.getAvailableLanguages = function () {
  return Object.keys(models)
}

module.exports.doLinkServiceMultipartAuto = async function (relayData) {
  try {
    const { file } = relayData

    if (file) {
      const startTime = Date.now()
      console.log(`${startTime}: Multipart request start with auto language detection`)
      console.log("🎤 Begin recognize process...")

      // Определяем правильное расширение файла
      let fileExtension = '.ogg' // по умолчанию

      if (file.filename) {
        fileExtension = path.extname(file.filename).toLowerCase()
      } else if (file.mimetype) {
        if (file.mimetype.includes('ogg')) fileExtension = '.ogg'
        else if (file.mimetype.includes('mp3')) fileExtension = '.mp3'
        else if (file.mimetype.includes('wav')) fileExtension = '.wav'
        else if (file.mimetype.includes('mp4')) fileExtension = '.mp4'
        else if (file.mimetype.includes('webm')) fileExtension = '.webm'
      }

      const audioFilePath = path.join(TEMP_CATALOG, `${startTime}${fileExtension}`)
      const wavFilePath = path.join(TEMP_CATALOG, `${startTime}.wav`)

      console.log(`📁 Original file type: ${fileExtension}`)
      console.log(`📁 Saving to: ${audioFilePath}`)

      fs.writeFileSync(audioFilePath, file.buffer)
      await convertToWav(audioFilePath, wavFilePath)

      const results = []

      for (const language of Object.keys(models)) {
        try {
          const transcript = await transcribeAudio(wavFilePath, language)
          results.push({
            language,
            text: transcript,
            confidence: transcript.length
          })
        } catch (err) {
          console.warn(`Failed to recognize with ${language} model:`, err.message)
        }
      }

      if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath)
      if (fs.existsSync(wavFilePath)) fs.unlinkSync(wavFilePath)

      const bestResult = results.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      )

      console.log("📜 Recognized results:", results)
      console.log("🏆 Best result:", bestResult)
      console.log("🎉 Process finished!")

      return bestResult
    }

    return null
  } catch (err) {
    console.error("Error in doLinkServiceMultipartAuto:", err.message)
    return null
  }
}