import Docker = require('dockerode');
/**
 * SQLite client.
 */
export const database = require('better-sqlite3')('data/db/ntcore.db', {});;
/**
 * Docker client.
 */
export const localDockerClient = new Docker();