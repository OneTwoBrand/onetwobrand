const enabled = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_DATA === 'true';

export function demoRows<T>(rows: T[]): T[] {
  return enabled ? rows : [];
}

export function demoValue<T>(value: T, emptyValue: T): T {
  return enabled ? value : emptyValue;
}
