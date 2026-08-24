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
});
