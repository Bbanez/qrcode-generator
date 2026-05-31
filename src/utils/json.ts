function circularReplacer() {
    const cache: unknown[] = [];
    return (_key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.includes(value)) return;
            cache.push(value);
        }
        return value;
    };
}

export function jsonSerialize(value: unknown, spaces?: number) {
    return JSON.stringify(value, circularReplacer(), spaces);
}
