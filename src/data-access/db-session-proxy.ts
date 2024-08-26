import {AsyncLocalStorage} from "node:async_hooks";

export class DbSessionProxy<T> {

    private static readonly dbSessionStorage = new AsyncLocalStorage<any>();

    static getDbSessionStorage() {
        return this.dbSessionStorage;
    }

    getSession() {
        const connection = DbSessionProxy.dbSessionStorage.getStore()?.get("connection");
        if (!connection) throw new Error("Could not obtain transaction-synchronized database session for current context");
        return connection as T;
    }
}