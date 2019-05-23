const algorithimia = require('algorithmia');
const algorithimiaApiKey = require('../credentials/algorithmia.json').apikey
const sentenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
const state = require('./state.js')

async function robot() {
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)

    await fetchKeywordsOfAllSentences(content)

    state.save(content)

    // console.log(JSON.stringify(content, null, 4));

    async function fetchContentFromWikipedia(content) {
        const algorithimiaAuthenticated = algorithimia(algorithimiaApiKey)
        const wikipediaAlgorithm = algorithimiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        try {
            const wikipediaResponse = await wikipediaAlgorithm.pipe({
                "lang": "pt",
                // "lang": "en",
                "articleName": content.searchTerm,
            })
            const wikipediaContent = wikipediaResponse.get()
            content.sourceContentOriginal = wikipediaContent.content
        } catch (error) {
            console.log('error')
            console.log(error)
            process.exit(0)
        }
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

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        const nlu = new NaturalLanguageUnderstandingV1({
            iam_apikey: watsonApiKey,
            version: '2018-04-05',
            url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
        })

        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    throw error
                }

                const keywords = response.keywords.map(keyword => keyword.text)

                resolve(keywords)
            })
        })
    }

    async function fetchKeywordsOfAllSentences(content) {
        for (const sentence of content.sentences) {
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
        }
    }
}

module.exports = robot