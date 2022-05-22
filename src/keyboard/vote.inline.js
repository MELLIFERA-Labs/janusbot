import { InlineKeyboard } from 'grammy'

export default function createVoteBtns(id, select = null) {
	const checker = (type) => (select === type && select !== null ? "✅" : "");
	return new InlineKeyboard()
		.text(
			`Yes ${checker('yes')}`,
			`${id}:yes`
		)
		.text(
			`No ${checker('no')}`,
			`${id}:no`
		)
		.row()
		.text(
			`Abstain ${checker('abstain')}`,
			`${id}:abstain`
		)
		.text(`NoWithVeto ${checker('no_with_veto')}`,`${id}:no_with_veto`)
}

