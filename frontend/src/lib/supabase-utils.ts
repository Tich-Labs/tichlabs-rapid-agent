export function snakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel) as any;
  if (typeof obj !== 'object' || obj instanceof Date) return obj;
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    acc[camelKey] = snakeToCamel(value);
    return acc;
  }, {} as any);
}
