const fs = require('fs')
const contentFilePath = './content.json'
const scriptFilePath = './content/after-effects-script.js'

function saveScript(content) {
    const contentString = JSON.stringify(content)
    const scriptString = `var content = ${contentString}`
    return fs.writeFileSync(scriptFilePath, scriptString)
}

/**
 * Salva o estado de content em arquivo
 * @param String content  Conteúdo a ser salvo
 * @return Boolean Sucesso da operação
 */
function save(content) {
    const contentString = JSON.stringify(content)
    return fs.writeFileSync(contentFilePath, contentString)
}

/**
 * Carrega o estado de content a partir do arquivo
 * @return void
 */
function load() {
    const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

module.exports = {
    save,
    saveScript,
    load
}