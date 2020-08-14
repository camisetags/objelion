/* global describe, test, expect */
import sum from '../src';

describe('Sum function', () => {
  test('sum 2 + 2', () => {
    expect(sum(2, 2)).toBe(4);
  });
});
