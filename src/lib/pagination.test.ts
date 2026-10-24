import { expect, it } from 'vitest';
import { getPaginationItems, parsePageTarget } from './pagination';

it('少量页码全部展示，单页不重复', () => {
  expect(getPaginationItems(1, 1)).toEqual([1]);
  expect(getPaginationItems(3, 6)).toEqual([1, 2, 3, 4, 5, 6]);
});
it('大量页面显示首页末页和邻近页码，省略中间长区间', () => {
  expect(getPaginationItems(1, 5000)).toEqual([1, 2, 3, 4, 5, 6, '…', 5000]);
  expect(getPaginationItems(2500, 5000)).toEqual([1, '…', 2498, 2499, 2500, 2501, 2502, '…', 5000]);
  expect(getPaginationItems(5000, 5000)).toEqual([1, '…', 4995, 4996, 4997, 4998, 4999, 5000]);
});
it('边界页码不重复、不越界，按钮数量有界', () => {
  for (const page of [1, 4, 5, 6, 8, 9, 10, 11, 12]) {
    const items = getPaginationItems(page, 12);
    const numbers = items.filter((item): item is number => typeof item === 'number');
    expect(numbers).toEqual([...new Set(numbers)].sort((a, b) => a - b));
    expect(numbers).toContain(page);
    expect(numbers[0]).toBe(1); expect(numbers.at(-1)).toBe(12);
    expect(numbers.length).toBeLessThanOrEqual(9);
  }
});
it('手动跳页接受范围内的整数，拒绝空白、越界、符号、小数和科学计数法', () => {
  expect(parsePageTarget(' 003 ', 5000)).toBe(3);
  expect(parsePageTarget('1', 5000)).toBe(1);
  expect(parsePageTarget('5000', 5000)).toBe(5000);
  for (const text of ['', ' ', '0', '5001', '-1', '+2', '1.5', '1e3', '0x10', '1,000', '9007199254740993']) expect(parsePageTarget(text, 5000)).toBeNull();
});
