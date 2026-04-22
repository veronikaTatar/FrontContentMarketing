export interface FilterStrategy<T> {
    apply(params: URLSearchParams, value: T): void;
    validate?(value: T): boolean; // ← опциональный метод, ? означает "может быть или нет"
}