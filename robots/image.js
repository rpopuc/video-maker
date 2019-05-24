const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state')
const googleSearchCredentials = require('../credentials/google-search.json')
// Google Apis em outras linguagens: https://github.com/googleapis
// Propriedades da busca: https://developers.google.com/apis-explorer/#p/customsearch/v1/search.cse.list

async function robot() {
    const content = state.load()
    await fetchImagesOfAllSentences(content)
    state.save(content)

    async function fetchImagesOfAllSentences(content) {
        for (const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)
            sentence.googleSearchQuery = query
        }
    }

    async function fetchGoogleAndReturnImagesLinks(query) {
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            searchType: 'image',
            imgSize: 'huge',
            q: query,
            num: 2,
        })

        return response.data.items.map(item => item.link)
    }
}

module.exports = robot
