const { MigrationError } = require('../util');

exports.connect = async function (opts={}) {
	const arangojs = require('arangojs');
	const client = new arangojs.Database(opts);

	client.query = client.query.bind(client)

	// arangojs@6 backwards compatibility
	if (client.useBasicAuth && opts.auth && opts.auth.username) {
		client.useBasicAuth(opts.auth.username, opts.auth.password)
	} else if (client.useBearerAuth && opts.auth && opts.auth.token) {
		client.useBearerAuth(opts.token)
	}
	if (client.useDatabase && opts.databaseName) {
		client.useDatabase(opts.databaseName)
	}

	client.aql = arangojs.aql

	return client;
}

exports.setup = async function (client) {
	const { aql } = require('arangojs')
	const migration = client.collection('migration')

	if (await migration.exists()) {
		const cursor = await client.query(aql`FOR doc IN migration SORT doc.created_at RETURN doc.name`)
		const names = await cursor.all()
		return names.map(name => ({ name }))
	} else {
		await migration.create()
		const ensureIndex = (migration.createIndex || migration.ensureIndex).bind(migration)
		await ensureIndex({
			type: 'persistent',
			fields: ['name'],
			unique: true
		})
		return []
	}
};

exports.loop = async function (client, files, method) {
	for (const obj of files) {
		const file = require(obj.abs);

		const collectionNames = Array.isArray(file.collections)
			? [ ...file.collections, 'migration' ]
			: (await client.listCollections()).map(({name}) => name)

		client.transaction = await client.beginTransaction({
			exclusive: collectionNames
		})

		try {
			if (typeof file[method] === 'function') {
				await Promise.resolve(file[method](client)).catch(err => {
					throw new MigrationError(err, obj);
				});
			}

			const transactionStep = (client.transaction.step || client.transaction.run).bind(client.transaction)
			if (method === 'up') {
				await transactionStep(() => client.query(client.aql`
					INSERT {
						name: ${obj.name},
						created_at: DATE_NOW()
					} IN migration
				`))
			} else if (method === 'down') {
				await transactionStep(() => client.query(client.aql`
					FOR doc IN migration
						FILTER doc.name == ${obj.name}
						REMOVE doc IN migration
				`))
			}

			await client.transaction.commit()
		} catch (err) {
			await client.transaction.abort()
			throw err;
		} finally {
			delete client.transaction
		}
	}
}

exports.end = async function (client) {
}
