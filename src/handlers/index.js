const newHandler = require('./new')
const joinHandler = require('./games')
const loadHandler = require('./load')
const gamesHandler = require('./games')
const startHandler = require('./start')
const mainMenuHandler = require('./mainMenu')
const inlineBackHandler = require('./inlineBack')
const inlineJoinHandler = require('./inlineJoin')
const inlineMoveHandler = require('./inlineMove')
const inlineLastTurn = require('./inlineLastTurn')
const inlineQueryHandler = require('./inlineQuery')
const inlineRejoinHandler = require('./inlineRejoin')
const inlineSettingsHandler = require('./inlineSettings')

module.exports = {
  newHandler,
  joinHandler,
  loadHandler,
  gamesHandler,
  startHandler,
  inlineLastTurn,
  mainMenuHandler,
  inlineBackHandler,
  inlineJoinHandler,
  inlineMoveHandler,
  inlineQueryHandler,
  inlineRejoinHandler,
  inlineSettingsHandler,
}
