async function processValidate(prompt, validate) {
	let isValid = false
	let answer = null
	while (!isValid) {
		answer = await prompt();
		isValid = await validate(answer);
	}
	return answer
}
function createMessageFromProposal({id, title, description, startTime, endTime}) {
	return `New proposal #${id}\n\n***${
		title
	}***\n\n${description}\n\nStart: ${
		startTime
	}\nEnd: ${endTime} \n\n`;
}
module.exports = {
	processValidate,
	createMessageFromProposal
}
