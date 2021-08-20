import { Pool } from "pg";

class PostgresAdaptor {
    pool: Pool;

    constructor() {
        this.pool = new Pool({
            database: 'postgres',
            user: 'yifu',
            password: '1234',
            port: 5432,
        });
    }

    public async executeQuery(query: string) {
        return await this.pool.query(query);
    }
}

module.exports = new PostgresAdaptor();