// 1. Фильтр по названию (строковый)
import type {FilterStrategy} from "./FilterStrategy.ts";

export class TitleFilter implements FilterStrategy<string> {
    apply(params: URLSearchParams, value: string): void {
        if (value && value.trim()) {
            params.set('title', value.trim());
        }
    }

    validate(value: string): boolean {
        return !value || value.length >= 2; // минимум 2 символа или пусто
    }
}
