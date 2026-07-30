export function distinct<T>(arr: T[]): T[] {
    return [...new Set(arr)]
}

/** Declaration order; unassigned (-1 or missing) sorts last, alphabetically among itself. */
export function byOrdinalThenName<T extends { ordinal?: number; propertyName: string }>(a: T, b: T): number {
    const ao = a.ordinal == null || a.ordinal < 0 ? Number.MAX_SAFE_INTEGER : a.ordinal;
    const bo = b.ordinal == null || b.ordinal < 0 ? Number.MAX_SAFE_INTEGER : b.ordinal;
    return ao !== bo ? ao - bo : a.propertyName.localeCompare(b.propertyName);
}