export abstract class DataSource<T> {
    abstract getConnection(): Promise<T>;

    abstract close(connection: T): void;
}