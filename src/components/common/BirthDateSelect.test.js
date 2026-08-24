import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import BirthDateSelect from './BirthDateSelect.vue';

let app;
let host;
let model;

async function selectValue(select, value) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await nextTick();
}

function mountPicker(initialValue = '') {
  model = ref(initialValue);
  host = document.createElement('div');
  document.body.appendChild(host);
  app = createApp({
    setup() {
      return () => h(BirthDateSelect, {
        modelValue: model.value,
        minYear: 2020,
        'onUpdate:modelValue': (value) => {
          model.value = value;
        },
      });
    },
  });
  app.mount(host);
}

describe('BirthDateSelect', () => {
  beforeEach(() => {
    mountPicker();
  });

  afterEach(() => {
    app.unmount();
    host.remove();
  });

  it('년, 월, 일을 선택하면 YYYY.MM.DD 값을 만든다', async () => {
    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');

    await selectValue(yearSelect, '2024');
    await selectValue(monthSelect, '2');
    await selectValue(daySelect, '29');

    expect(model.value).toBe('2024.02.29');
  });

  it('선택한 연월에 맞춰 윤년의 일 목록을 제공한다', async () => {
    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');

    await selectValue(yearSelect, '2024');
    await selectValue(monthSelect, '2');

    const dayValues = [...daySelect.options].map((option) => option.value);
    expect(dayValues).toContain('29');
    expect(dayValues).not.toContain('30');
  });

  it('연도 변경으로 날짜가 범위를 벗어나면 보정된 값을 한 번에 반영한다', async () => {
    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');

    await selectValue(yearSelect, '2024');
    await selectValue(monthSelect, '2');
    await selectValue(daySelect, '29');
    await selectValue(yearSelect, '2023');

    expect(daySelect.value).toBe('28');
    expect(model.value).toBe('2023.02.28');
  });
});

describe('BirthDateSelect 기존 값 표시', () => {
  beforeEach(() => {
    mountPicker('2023.05.12');
  });

  afterEach(() => {
    app.unmount();
    host.remove();
  });

  it('수정 화면의 기존 생년월일을 각 선택 목록에 반영한다', () => {
    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');

    expect(yearSelect.value).toBe('2023');
    expect(monthSelect.value).toBe('5');
    expect(daySelect.value).toBe('12');
  });

  it('연도를 지우면 월과 일을 함께 초기화한다', async () => {
    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');

    await selectValue(yearSelect, '');

    expect(model.value).toBe('');
    expect(monthSelect.value).toBe('');
    expect(daySelect.value).toBe('');
  });
});

describe('BirthDateSelect 레거시 값 보호', () => {
  afterEach(() => {
    app.unmount();
    host.remove();
  });

  it('0패딩이 없는 날짜를 표시하되 부모 값을 임의로 덮어쓰지 않는다', async () => {
    mountPicker('2023.5.2');
    await nextTick();

    const [yearSelect, monthSelect, daySelect] = host.querySelectorAll('select');
    expect(yearSelect.value).toBe('2023');
    expect(monthSelect.value).toBe('5');
    expect(daySelect.value).toBe('2');
    expect(model.value).toBe('2023.5.2');
  });

  it('해석할 수 없는 외부 값도 빈 문자열로 emit하지 않는다', async () => {
    mountPicker('legacy-date');
    await nextTick();

    expect(model.value).toBe('legacy-date');
    expect([...host.querySelectorAll('select')].map((select) => select.value))
      .toEqual(['', '', '']);
  });
});
