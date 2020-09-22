exports.collections = [ 'todos' ]

exports.up = async DB => {
	console.log('hello from inside :: 002 @ up');

	const todos = await DB.collection('todos')

	const items = [{
		name: 'get this working',
		completed: false,
	}, {
		name: 'test "UP" direction',
		completed: true
	}, {
		name: 'test "DOWN" direction',
		completed: false,
	}, {
		name: 'add `pg` driver',
		completed: false,
	}];

	for (const obj of items) {
		await DB.transaction.step(() => todos.save({
			name: obj.name,
			completed: obj.completed
		}))
	}
}

exports.down = async DB => {
	console.log('hello from inside :: 002 @ down');
	const todos = await DB.collection('todos')
	await DB.transaction.step(() => todos.truncate())
}
