// 1. Фильтр по названию (строковый)
import type {FilterStrategy} from "./FilterStrategy.ts";




// 3. Фильтр по тегам (массив строк)
export class TagsFilter implements FilterStrategy<string[]> {
    apply(params: URLSearchParams, value: string[]): void {
        if (value && value.length > 0) {
            value.forEach(tag => {
                if (tag.trim()) {
                    params.append('tags', tag.trim());
                }
            });
        }
    }
}