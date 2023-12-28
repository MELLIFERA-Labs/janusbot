import { AppContext } from '../bot';

export function getUserIdFromCtx(ctx: AppContext) {
  return (ctx.update?.message?.from?.id ??
    ctx.update?.callback_query?.from.id ??
    ctx.update?.my_chat_member?.from.id) as number;
}
