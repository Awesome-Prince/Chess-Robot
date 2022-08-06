const chess = require('chess')

const { board } = require('@/keyboards')


module.exports = () => async (ctx) => {
  let user = await ctx.db('users')
    .where('id', Number(ctx.from.id))
    .first()

  if (user) {
    if (JSON.stringify(user) !== JSON.stringify(ctx.from)) {
      await ctx.db('users')
        .where('id', Number(user.id))
        .update(ctx.from)
        .catch(debug)
    }
  } else {
    await ctx.db('users').insert(ctx.from).catch(debug)
    user = await ctx.db('users').where('id', ctx.from.id).first().catch(debug)
  }


      ...board({
        board: status.board.squares,
        isWhite: true,
        callbackOverride: `join::w::${user.id}`,
        actions: [{
          text: 'Join the game',
          callback_data: `join::w::${user.id}`,
        }, {
          text: 'New game',
          switch_inline_query_current_chat: '',
        }],
      }),

  }).catch(debug)
}
