const algorithimia = require('algorithmia');
const algorithimiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    //console.log(`Recebi com sucesso o content: ${content.searchTerm}`)


    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    console.log(content.sentences)

    async function fetchContentFromWikipedia(content) {
        const algorithimiaAuthenticated = algorithimia(algorithimiaApiKey)
        const wikipediaAlgorithm = algorithimiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()
        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        function removeBlankLines(lines) {
            return lines.filter(line => line.trim().length !== 0)
        }

        function removeMarkdown(lines) {
            return lines.filter(line => ! line.trim().startsWith('='))
        }

        function removeDatesInParentesis(lines) {
            return lines.map(line => line.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' '))
        }

        let clearedLines = content.sourceContentOriginal.split('\n')

        clearedLines = removeBlankLines(clearedLines)
        clearedLines = removeMarkdown(clearedLines)
        clearedLines = removeDatesInParentesis(clearedLines)

        content.sourceContentSanitized = clearedLines.join(' ')
    }

    function breakContentIntoSentences(content) {
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        content.sentences = sentences.map(sentence => {
            return {
                text: sentence,
                keywords: [],
                images: []
            }
        })
    }
}

module.exports = robot