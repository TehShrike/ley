const { aql } = require('arangojs')

const text = 'add `mysql` driver';

exports.up = async DB => {
	console.log('hello from inside :: 003 @ up');
	const todos = await DB.collection('todos')
	await DB.transaction.step(() => todos.save({ name: text }))
}

exports.down = async DB => {
	console.log('hello from inside :: 003 @ down');
	await DB.transaction.step(() => DB.query(aql`
		FOR doc IN migration
			FILTER doc.name == ${text}
			REMOVE doc IN migration
	`))
}
