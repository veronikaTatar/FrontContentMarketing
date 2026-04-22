import type {FilterStrategy} from "./FilterStrategy.ts";


// 2. Фильтр по статусу
export class StatusFilter implements FilterStrategy<string> {
    private allowedStatuses = ['draft', 'review', 'approved', 'rejected', ''];

    apply(params: URLSearchParams, value: string): void {
        if (value && this.allowedStatuses.includes(value)) {
            params.set('status', value);
        }
    }

    // У этого фильтра нет validate - он опциональный!
    // validate? означает, что метод может отсутствовать
}
