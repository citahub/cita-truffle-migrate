var log = console.log.bind(console)
// 使用下面的 log 替代, 从而取消 log
var log = () => {}

log.title = (title) => {
    return log.bind(console, `-- ${title} --\n`)
}

module.exports = log