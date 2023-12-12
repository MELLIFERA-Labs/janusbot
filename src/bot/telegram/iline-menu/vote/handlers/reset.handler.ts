import { type CtxHandler } from '../../../iline'

export const resetHandler = () => async (req: CtxHandler) => {
  await req.ctx.reset()
}
