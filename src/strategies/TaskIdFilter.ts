import type {FilterStrategy} from "./FilterStrategy.ts";

export class TaskIdFilter implements FilterStrategy<number | null> {
    apply(params: URLSearchParams, value: number | null): void {
        if (value && value > 0) {
            params.set('idTask', value.toString());
        }
    }
}
