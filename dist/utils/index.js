var log = console.log.bind(console)
// var log = () => {}

log.title = (title) => {
    return log.bind(console, `-- ${title} --\n`)
}

module.exports = log