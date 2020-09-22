exports.collections = []

exports.up = async DB => {
	console.log('hello from inside :: 001 @ up');

	const todos = await DB.collection('todos')

	await todos.create()
}

exports.down = async DB => {
	console.log('hello from inside :: 001 @ down');
	const todos = await DB.collection('todos')
	await todos.drop()
}
