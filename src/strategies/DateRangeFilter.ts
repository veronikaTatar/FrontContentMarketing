import type {FilterStrategy} from "./FilterStrategy.ts";

export class DateRangeFilter implements FilterStrategy<{ from?: Date; to?: Date }> {
    apply(params: URLSearchParams, range: { from?: Date; to?: Date }): void {
        if (range.from) {
            params.set('from', range.from.toISOString());
        }
        if (range.to) {
            params.set('to', range.to.toISOString());
        }
    }

    validate(range: { from?: Date; to?: Date }): boolean {
        if (range.from && range.to) {
            return range.from <= range.to;
        }
        return true;
    }
}