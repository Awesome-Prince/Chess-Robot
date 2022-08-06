require('dotenv').config()
require('module-alias/register')

const knex = require('knex')


const { session } = Telegraf
const {

  inlineBackHandler,
  inlineJoinHandler,
  inlineMoveHandler,
  inlineQueryHandler,
  inlineRejoinHandler,
  inlineSettingsHandler,
} = require('@/handlers')

const knexConfig = require('@/../knexfile')

const { BOT_NAME, BOT_TOKEN } = process.env

const bot = new Telegraf(BOT_TOKEN, { username: BOT_NAME })
const stage = new Stage([gameScene])

bot.context.db = knex(knexConfig)

bot.use(stage.middleware())

bot.use(session({
  property: 'game',
  getSessionKey: (ctx) => (ctx.callbackQuery && ctx.callbackQuery.inline_message_id) ||
    (ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`),
}))

// bot.use(async (ctx, next) => {
//   debug(ctx.update)
//   // debug(ctx.game)
//   next(ctx)
//   // if (ctx.chat && ctx.chat.type === 'private') {
//   // }
// })

// bot.command('start', startHandler())


bot.action(...inlineBackHandler())
bot.action(...inlineJoinHandler())
bot.action(...inlineMoveHandler())
bot.action(...inlineRejoinHandler())
bot.action(...inlineSettingsHandler())

bot.on('chosen_inline_result', async (ctx) => {
  log(
    preLog('BORD', `${makeUserLog(ctx.update.chosen_inline_result.from)}| [${ctx.update.chosen_inline_result.result_id === 2 ? 'black' : 'white'}] {${ctx.update.chosen_inline_result.inline_message_id}}`),
    ctx
  )
})

bot.catch((err) => debug(err))

bot.telegram.getUpdates(1, -1).then(() => bot.launch())
