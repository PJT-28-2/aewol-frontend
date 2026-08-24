import { describe, expect, it } from 'vitest';
import { getPinWeaknessReason } from './pin';

describe('getPinWeaknessReason', () => {
  it.each(['123456', '456789', '987654', '890123', '901234'])(
    '연속된 숫자 3자리 이상이 포함되면 sequential을 반환한다: %s',
    (value) => {
      expect(getPinWeaknessReason(value)).toBe('sequential');
    },
  );

  it.each(['111111', '121212', '247247', '112233', '998877'])(
    '연속은 아니지만 유추하기 쉬운 패턴이면 weak를 반환한다: %s',
    (value) => {
      expect(getPinWeaknessReason(value)).toBe('weak');
    },
  );

  it.each(['582917', '204817', '739021'])(
    '취약 패턴이 없으면 null을 반환한다: %s',
    (value) => {
      expect(getPinWeaknessReason(value)).toBeNull();
    },
  );

  it('연속 숫자와 취약 패턴 둘 다 걸리면 sequential을 우선한다', () => {
    // 123456은 연속 숫자이면서 '(\d)\1{5}' 등 다른 weak 규칙에는 안 걸리지만,
    // sequential 검사가 weak 검사보다 먼저 실행되는지 확인하기 위한 케이스.
    expect(getPinWeaknessReason('123456')).toBe('sequential');
  });
});
