const axios = require('axios')
const qs = require('qs')

module.exports.proxy = async function (language, text) {
  try {
    const URL_LANG_TOOL = process.env.URL_LANG_TOOL

    const data = qs.stringify({
      language: language,
      text: text
    })

    const response = await axios.post(URL_LANG_TOOL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (response.status === 200) {
      return response.data
    } else {
      console.error('Error response when check LANG_TOOL:', response.statusText)
    }
  } catch (error) {
    console.error('Error check LANG_TOOL:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
    }
  }
}