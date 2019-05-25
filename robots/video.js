const gm = require('gm').subClass({imageMagick: true})
const state = require('./state')
const spawn = require('child_process').spawn
const path = require('path')
const rootPath = path.resolve(__dirname, '..')

async function robot() {
    console.log("> [video-robot] Starting...")

    // Carrega a estutura do arquivo
    const content = state.load()

    // Converte as imagens para o tamanho ideal para vídeo
    // em 1920x1080
    // await convertAllImages(content)

    // Cria imagens a partir das sentenças de texto
    // await createAllSentenceImages(content)

    // Cria a imagem de capa para o Youtube
    // await createYoutubeThumbnail()

    await createAfterEffectsScript(content)
    await renderVideoWithAfterEffects()

    // Salva a estrutura em disco
    //state.save(content)

    // Função para converter todas as imagens para um formato
    // indicado para o vídeo
    async function convertAllImages(content)
    {
        // Para cada sentença em conteúdo
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            // Converte a imagem para o formato indicado para o vídeo
            await convertImage(sentenceIndex)
        }
    }

    // Função para converter a imagem para um formato
    // indicado para o vídeo
    async function convertImage(sentenceIndex) {
        // Retorna uma promise, para o padrão async/await
        return new Promise((resolve, reject) => {
            // Arquivo de imagem de entrada
            const inputFile = `./content/${sentenceIndex}-original.png[0]`

            // Arquivo de imagem de saída
            const outputFile = `./content/${sentenceIndex}-converted.png`

            // Largura e altura da imagem de saída
            const width = 1920
            const height = 1080

            // Com uso do ImageMagick
            gm()
                // Define o arquivo de entrada
                .in(inputFile)

                // Define o primeiro passso de conversão
                .out('(')
                    // Copia a imagem original (no primeiro layer)
                    .out('-clone')
                    .out('0')

                    // Configura o fundo como branco
                    .out('-background', 'white')

                    // Borra a imagem
                    .out('-blur', '0x9')

                    // E a redimensiona para o tamanho de saída
                    .out('-resize', `${width}x${height}^`)
                .out(')')

                // Define o segundo passso de conversão
                .out('(')
                    // Copia a imagem original (no primeiro layer)
                    .out('-clone')
                    .out('0')

                    // Configura o fundo como branco
                    .out('-background', 'white')

                    // E redimensiona a imagem para o tamanho de saída
                    .out('-resize', `${width}x${height}`)
                .out(')')

                // Apaga o primeiro layer da imagem (a imagem original)
                .out('-delete', '0')

                // Define o alinhamento ao centro
                .out('-gravity', 'center')

                // Sobrepõe as camadas e as compõem
                .out('-compose', 'over')
                .out('-composite')

                // Define o tamanho de saída da imagem
                .out('-extent', `${width}x${height}`)

                // Escreve o arquivo em disco
                .write(outputFile, (error) => {
                    // Em caso de erro
                    if (error) {
                        // Retorna o erro em catch
                        reject(error)
                    }

                    console.log(`> [video-robot] Image converted: ${inputFile}`)

                    // Retorna sucesso
                    resolve()
                })
        })
    }

    // Função para criar as imagens com os textos das sentenças
    async function createAllSentenceImages(content) {
        // Para cada sentença em conteúdo
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            // Cria uma imagem com o texto da sentença
            await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
        }
    }

    // Função para cria uma imagem com o texto da sentença
    async function createSentenceImage(sentenceIndex, sentenceText) {
        // Retorna uma promise, para o padrão async/await
        return new Promise((resolve, reject) => {
            // Nome do arquivo de saída
            const outputFile = `./content/${sentenceIndex}-sentence.png`

            // Configuração dos tamanhos das imagens
            // de acordo com o índice do texto
            const templateSettings = {
                0: {
                    size: '1920x400',
                    gravity: 'center',
                },
                1: {
                    size: '1920x1080',
                    gravity: 'center',
                },
                2: {
                    size: '800x1080',
                    gravity: 'west',
                },
                3: {
                    size: '1920x400',
                    gravity: 'center',
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center',
                },
                5: {
                    size: '800x1080',
                    gravity: 'west',
                },
                6: {
                    size: '1920x600',
                    gravity: 'center',
                },
            }

            // Com o uso do ImageMagick
            gm()
                // Configura o tamanho de saída da imagem
                // de acordo com o índice da imagem
                .out('-size', templateSettings[sentenceIndex].size)

                // Configura o alinhamento do texto
                // de acordo com o índice da imagem
                .out('-gravity', templateSettings[sentenceIndex].gravity)

                // Configura a cor de fundoc como transparente
                .out('-background', 'transparent')

                // Configura a cor do texto como branca
                .out('-fill', 'white')

                // Configura a altura do parágrafo como -1
                .out('-kerning', '-1')

                // Configura o texto a ser impresso
                .out(`caption:${sentenceText}`)

                // Escreve o arquivo de saída
                .write(outputFile, error => {
                    // Em caso de erro
                    if (error) {
                        // Retorna o erro em catch
                        reject(error)
                    }

                    console.log(`> [video-robot] Sentence created: ${outputFile}`)

                    // Retorna sucesso
                    resolve()
                })
        })
    }

    // Função para criar imagem de capa do vídeo
    // para o Youtube
    async function createYoutubeThumbnail() {
        // Retorna uma promise, para o padrão async/await
        return new Promise((resolve, reject) => {
            // Utiliza o ImageMagick para converter
            // a imagem de png para jpeg
            // Isso é necessário pois o Youtube limita
            // o tamanho da imagem de capa, e o formato
            // png é mais 'pesado' que o formato jpeg.
            gm()
                // Obtém a imagem de entrada
                .in('./content/0-converted.png')

                // E a converte para o formato jpeg
                .write('./content/youtube-thumbnail.jpg', (error) => {
                    // Em caso de erro
                    if (error) {
                        // Retorna o erro em catch
                        reject(error)
                    }

                    console.log(`> ǘideo-robot] Youtube Thumbnail created`)

                    // Retorna o sucesso
                    resolve()
                })
        })
    }

    // Cria o script para o After Effects
    async function createAfterEffectsScript(content) {
        await state.saveScript(content)
    }

    async function renderVideoWithAfterEffects() {
        return new Promise((resolve, reject) => {
            const aerenderFilePath = '..'
            const templateFilePath = `${rootPath}/templates/1/template.aep`
            const destinationFilePath = `${rootPath}/content/output.mov`

            console.log(`> [video-robot] Starting After Effects`)

            const aerender = spawn(aerenderFilePath, [
                '-comp', 'main',
                '-project', templateFilePath,
                '-output', destinationFilePath
            ])

            aerender.stdout.on('data', (data) => {
                process.stdout.write(data)
            })

            aerender.on('close', () => {
                console.log('> [video-robot] After Effects closed')
                resolve()
            })
        })
    }
}

// Disponibiliza o robot para uso
module.exports = robot
