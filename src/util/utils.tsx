export function distinct<T>(arr: T[]): T[] {
    return [...new Set(arr)]
}