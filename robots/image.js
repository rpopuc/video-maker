const imageDownloader = require('image-downloader')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state')
const googleSearchCredentials = require('../credentials/google-search.json')
// Google Apis em outras linguagens: https://github.com/googleapis
// Propriedades da busca: https://developers.google.com/apis-explorer/#p/customsearch/v1/search.cse.list

async function robot() {
    // Carrega a estutura do arquivo
    const content = state.load()

    // Obtém as urls das imagens relacionadas ao termo
    // e às sentenças
    // await fetchImagesOfAllSentences(content)

    // Efetua o download das imagens obtidas
    await downloadAllImages(content)

    // Salva a estrutura em disco
    //state.save(content)

    // Busca (as urls) de imagens de todas as senteças
    async function fetchImagesOfAllSentences(content) {
        // Para cada sentença na lista de sentenças
        for (const sentence of content.sentences) {
            // Monta o texto de consulta com o termo e a palavra chave
            const query = `${content.searchTerm} ${sentence.keywords[0]}`

            // Obtém a lista das urls das imagens a partir da api do google
            // e a armazena no objeto da sentença
            sentence.images = await fetchGoogleAndReturnImagesLinks(query)

            // Guarda o texto de consulta na sentença
            sentence.googleSearchQuery = query
        }
    }

    // Executa a busca do google e obtém uma lista
    // de imagens a partir do termo indicado em `query`
    async function fetchGoogleAndReturnImagesLinks(query) {
        // Executa a consulta pela api do google
        const response = await customSearch.cse.list({
            // Chave de autenticação
            auth: googleSearchCredentials.apiKey,

            // Contexto da busca
            cx: googleSearchCredentials.searchEngineId,

            // Tipo de conteúdo buscado
            searchType: 'image',

            // Tamanho da imagem desejado
            imgSize: 'huge', // enorme

            // Texto de consulta
            q: query,

            // Limite de resultados esperado
            num: 2,
        })

        return response.data.items.map(item => item.link)
    }

    // Função para baixar todas as imagens encontradas
    // com a google search api
    async function downloadAllImages(content) {
        // Inicia lista de imagens baixadas
        content.downloadedImages = []

        // Para cada sentença encontrada para o termo
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {

            // Para cada imagem obtida pelo termo + (keyword da) sentença
            const images = content.sentences[sentenceIndex].images
            for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
                // Obtém a url da imagem
                const imageUrl = images[imageIndex]

                // Tenta efetuar o download da imagem
                try {
                    // Se a imagem já foi baixada anteriormente, ignore
                    if (content.downloadedImages.includes(imageUrl)) {
                        throw new Error('Imagem já foi baixada')
                    }

                    // Efetua o download da imagem e a salva em disco
                    await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)

                    // Adiciona a url da imagem à lista de imagens baixadas
                    content.downloadedImages.push(imageUrl)

                    console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem com sucesso: ${imageUrl}`)
                    break
                } catch (error) {
                    console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar ${imageUrl}> ${error}`)
                }
            }
        }
    }

    async function downloadAndSave(url, fileName) {
        return imageDownloader.image({
            url,
            dest: `./content/${fileName}`,
        })
    }
}

module.exports = robot
