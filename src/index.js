require('dotenv').config()
require('module-alias/register')

const Sequelize = require('sequelize')
const knex = require('knex')


const { session } = Telegraf
const {

  inlineBackHandler,
  inlineJoinHandler,
  inlineMoveHandler,
  inlineQueryHandler,
  inlineSettingsHandler,
} = require('@/handlers')


const { BOT_NAME, BOT_TOKEN } = process.env

const bot = new Telegraf(BOT_TOKEN, { username: BOT_NAME })
const stage = new Stage([gameScene])

bot.context.sequelize = new Sequelize(DB_STRING)
bot.context.sequelize.sync()
bot.context.db = knex(knexConfig)

bot.use(stage.middleware())

bot.use(session({
  property: 'game',
  getSessionKey: (ctx) => (ctx.callbackQuery && ctx.callbackQuery.inline_message_id) ||
    (ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`),
}))

// bot.command('start', startHandler())


bot.action(...inlineBackHandler())
bot.action(...inlineJoinHandler())
bot.action(...inlineMoveHandler())
bot.action(...inlineSettingsHandler())

bot.command('pay', async ctx => await isPayed(ctx) ? ctx.reply('payed') : pay(ctx))

bot.on('chosen_inline_result', async (ctx) => {
  log(
    preLog('BORD', `${makeUserLog(ctx.update.chosen_inline_result.from)}| [${ctx.update.chosen_inline_result.result_id === 2 ? 'black' : 'white'}] {${ctx.update.chosen_inline_result.inline_message_id}}`),
    ctx,
  )
})

bot.catch((err) => debug(err))

bot.telegram.getUpdates(1, -1).then(() => bot.launch())
