const chess = require('chess')

const {
  log,
  debug,
  preLog,
  getGame,
  isWhiteTurn,
  isWhiteUser,
  isBlackUser,
  makeUserLog,
  makeBoardImageUrl,
} = require('@/helpers')
const { board, actions, promotion } = require('@/keyboards')

// eslint-disable-next-line id-length
const sortFunction = (a, b) => JSON.stringify(a) > JSON.stringify(b) ? 1 : -1
const mapFunction = ({ dest }) => dest

const statusMessage = ({ isCheck, isCheckmate, isRepetition }) => `
${isCheck ? '|CHECK|' : ''}${isCheckmate ? '|CHECKMATE|' : ''}${isRepetition ? '|REPETITION|' : ''}`

const topMessage = (whiteTurn, player, enemy) => whiteTurn
  ? `White (top): ${player.first_name}
Black (bottom): [${enemy.first_name}](tg://user?id=${enemy.id})
Black's turn | [Discussion](https://t.me/chessy_bot_chat)`
  : `Black (top): ${player.first_name}
White (bottom): [${enemy.first_name}](tg://user?id=${enemy.id})
White's turn | [Discussion](https://t.me/chessy_bot_chat)`

module.exports = () => [
  /^([a-h])([1-8])([QRNB])?$/,
  async (ctx) => {
    if (ctx.game.busy) {
      return ctx.answerCbQuery()
    }

    ctx.game.busy = true

    const gameEntry = await getGame(ctx)

    if (typeof gameEntry === 'boolean') {
      return gameEntry
    }

    if (gameEntry === null) {
      // TODO add function to say user about error
      return
    }

    if (!isBlackUser(gameEntry, ctx) && !isWhiteUser(gameEntry, ctx)) {
      ctx.game.busy = false
      return ctx.answerCbQuery('Sorry, this game is busy. Try to make a new one.')
    }

    ctx.game.entry = gameEntry
    ctx.game.config = JSON.parse(gameEntry.config) || { rotation: 'dynamic' }

    const gameMoves = await ctx.db('moves')
      .where('game_id', gameEntry.id)
      .orderBy('created_at', 'asc')
      .select()

    if ((isWhiteTurn(gameMoves) && isBlackUser(gameEntry, ctx)) ||
      (!isWhiteTurn(gameMoves) && isWhiteUser(gameEntry, ctx))) {
      ctx.game.busy = false
      return ctx.answerCbQuery('Wait, please. Now is not your turn.')
    }

    const gameClient = chess.create({ PGN: true })

    gameMoves.forEach(({ entry }) => {
      try {
        gameClient.move(entry)
      } catch (error) {
        debug(error)
      }
    })

    const enemy = await ctx.db('users')
      .where('id', isWhiteUser(gameEntry, ctx)
        ? Number(gameEntry.blacks_id)
        : Number(gameEntry.whites_id))
      .first()
      .catch(debug)

    let status = gameClient.getStatus()
    const pressed = status.board.squares
      .find(({ file, rank }) => file === ctx.match[1] && rank === Number(ctx.match[2]))

    if (
      !ctx.game.selected &&
      (!pressed ||
      !pressed.piece ||
      (pressed.piece.side.name === 'black' && isWhiteTurn(gameMoves)) ||
      (pressed.piece.side.name === 'white' && !isWhiteTurn(gameMoves)))
    ) {
      ctx.game.busy = false
      return ctx.answerCbQuery()
    }
    /**
     * Selection of a piece
     */
    if (
      pressed && pressed.piece &&
      ((pressed.piece.side.name === 'white' && isWhiteTurn(gameMoves)) ||
      (pressed.piece.side.name === 'black' && !isWhiteTurn(gameMoves))) &&
      !(ctx.game.selected &&
        pressed.file === ctx.game.selected.file &&
        pressed.rank === ctx.game.selected.rank)
    ) {
      const allowedMoves = Object.keys(status.notatedMoves)
        .filter((key) => status.notatedMoves[key].src === pressed)
        .map((key) => ({ ...status.notatedMoves[key], key }))


      ctx.game.lastBoard = board({
        board: status.board.squares.map((square) => {
          const move = allowedMoves
            .find((({ file, rank }) => ({ dest }) => dest.file === file &&
              dest.rank === rank)(square))

          return move ? { ...square, move } : square
        }),
        isWhite: isWhiteTurn(gameMoves),
        actions: actions(),
      })



        },
        {
          ...ctx.game.lastBoard,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        },


      ctx.game.allowedMoves = allowedMoves
      ctx.game.selected = pressed

      ctx.game.busy = false
      return ctx.answerCbQuery(`${pressed.piece.type} ${pressed.file}${pressed.rank}`)
    }

    /**
     * Selection of a destination to move
     */
    if (ctx.game.selected) {
      if (
        ctx.game.selected.piece.type === 'pawn' &&
        (
          (isWhiteTurn(gameMoves) && ctx.game.selected.rank === 7 && pressed.rank === 8) ||
          (!isWhiteTurn(gameMoves) && ctx.game.selected.rank === 2 && pressed.rank === 1)
        ) &&
        !ctx.game.promotion
      ) {
        ctx.game.promotion = pressed

        const makeMoves = ctx.game.allowedMoves.filter(
          ({ dest: { file, rank } }) => file === pressed.file && rank === pressed.rank,
        )
        const keyboardRow = promotion({ makeMoves, pressed })
        const board = ctx.game.lastBoard.reply_markup

        board.inline_keyboard.unshift(keyboardRow)

        await ctx.editMessageReplyMarkup(board)
          .catch(debug)

        ctx.game.busy = false
        return ctx.answerCbQuery('Please choose the piece to promote the pawn!')
      }

      let makeMove

      if (ctx.game.promotion) {
        makeMove = ctx.game.allowedMoves.find(({ key, dest: { file, rank } }) => (
          file === pressed.file && rank === pressed.rank && key.endsWith(ctx.match[3])
        ))
        ctx.game.promotion = null
      } else {
        makeMove = ctx.game.allowedMoves.find(
          ({ dest: { file, rank } }) => file === pressed.file && rank === pressed.rank,
        )
      }

      if (makeMove) {
        try {
          gameClient.move(makeMove.key)
        } catch (error) {
          debug(error)
        }

        await ctx.db('moves').insert({
          game_id: ctx.game.entry.id,
          entry: makeMove.key,
        }).catch(debug)

        log(
          preLog('MOVE', `${gameEntry.id} ${makeMove.key} ${gameMoves.length + 1} ${makeUserLog(ctx.from)}`),
          ctx,
        )
      }

      status = gameClient.getStatus()



      return ctx.answerCbQuery()
    }
  },
]
