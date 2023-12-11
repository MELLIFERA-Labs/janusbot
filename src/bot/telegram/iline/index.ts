import { type InlineKeyboardMarkup } from '@grammyjs/types/markup'
import { type Context as AppContext } from 'grammy'
export const DELIMITER = '%'
interface ActionMenuMethods {
  reset: () => Promise<void>
  resetWithText: (text: string) => Promise<void>
  registerMenuData: (action: string, data?: string) => string
}

export type ActionMenuCtx = AppContext & ActionMenuMethods
export interface CtxHandler {
  data: string
  ctx: ActionMenuCtx
}
interface ActionMenu {
  type: string
  preRequest?: (
    handler: (ctx: CtxHandler) => Promise<void>,
  ) => (ctx: CtxHandler) => Promise<void>
  startPoint: {
    menu: () => InlineKeyboardMarkup
    transition: string
  }
  actions: Record<
    string,
    (
      handler?: (ctx: CtxHandler) => Promise<void>,
    ) => (ctx: CtxHandler) => Promise<void>
  >
}

function compose(...fns: any[]) {
  return async (x?: any) => {
    return fns.reduceRight(async (functionInPromise, f) => {
      return f(async (ctx: any) => {
        if (!ctx) {
          throw new Error('Compose error: ctx is not defined')
        }
        const func = await functionInPromise
        return func(ctx)
      })
    }, x)
  }
}

class Index {
  private readonly registry: Map<string, ActionMenu>
  constructor() {
    this.registry = new Map()
  }

  registerActionMenu(menu: ActionMenu): void {
    this.registry.set(menu.type, menu)
  }

  async dispatchActionMenu(
    ctx: AppContext,
    callbackQuery: string,
  ): Promise<boolean> {
    const [type, canBeAction, data] = callbackQuery.split(DELIMITER)
    let action = canBeAction
    const typeAction = this.registry.get(type)
    if (
      typeAction &&
      (action === undefined || Number.isInteger(parseInt(action)))
    ) {
      action = typeAction.startPoint.transition
    }
    if (!typeAction?.actions[action]) {
      return false
    }
    const inlineCtx = ctx as ActionMenuCtx
    inlineCtx.reset = async () => {
      await ctx.editMessageReplyMarkup({
        reply_markup: typeAction.startPoint.menu(),
      })
    }
    inlineCtx.resetWithText = async (text: string) => {
      await ctx.answerCallbackQuery({
        text,
        show_alert: true,
      })
      await ctx.editMessageReplyMarkup({
        reply_markup: typeAction.startPoint.menu(),
      })
    }
    const execObj = {
      data,
      ctx: inlineCtx,
    }
    inlineCtx.registerMenuData = (action, data) => {
      return `${typeAction.type}${DELIMITER}${action}${DELIMITER}${data}`
    }

    if (typeAction.preRequest) {
      const result = await compose(
        Proxy,
        typeAction.preRequest,
        typeAction.actions[action],
      )()
      await result(execObj)
      return true
    }

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const res = await typeAction.actions[action]
    await res()(execObj)
    return true
  }
}
const iline = new Index()

export { compose, iline }
