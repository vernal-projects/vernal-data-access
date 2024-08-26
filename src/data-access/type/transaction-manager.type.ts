import {DataSource} from "./data-source.type.js";

export abstract class TransactionManager <T>{
     abstract begin(connection: T, datasource: DataSource<T>): Promise<void>;
     abstract commit(connection: T, datasource: DataSource<T>): Promise<void>;
     abstract rollback(connection: T, datasource: DataSource<T>): Promise<void>;
}