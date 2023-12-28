import { iline } from '../iline';
import { confirmHandler } from './vote/handlers/confirm.handler';
import { resetHandler } from './vote/handlers/reset.handler';
import { selectVoteHandler } from './vote/handlers/selectvote.handler';
import { voteHandler } from './vote/handlers/vote.handler';
import { walletHandler } from './vote/handlers/wallet.handler';
import { createLoadingBtn } from './vote/menu/loading.menu';
import { createStartVoteBtn } from './vote/menu/start-vote.menu';

export const loadingMenuState = new WeakSet();

iline.registerActionMenu({
  type: 'start_vote',
  startPoint: { menu: createStartVoteBtn, transition: 'wallet' },
  preRequest: handler => async req => {
    try {
      await req.ctx.editMessageReplyMarkup({
        reply_markup: createLoadingBtn(),
      });
      loadingMenuState.add(req.ctx);
      await handler(req);
      loadingMenuState.delete(req.ctx);
    } catch (e) {
      console.error(e, 'error in preRequest');
      await req.ctx.resetWithText(
        'Something went wrong, please try again later',
      );
    }
  },
  actions: {
    wallet: walletHandler,
    select: selectVoteHandler,
    confirm: confirmHandler,
    vote: voteHandler,
    reset: resetHandler,
  },
});
