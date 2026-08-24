import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, h, nextTick, ref } from 'vue';
import BirthDateSelect from './BirthDateSelect.vue';

let app;
let host;
let model;

function trigger(field) {
  return host.querySelector(`[data-testid="birth-${field}-trigger"]`);
}

async function openSheet(field) {
  trigger(field).click();
  await nextTick();
  // 같은 시트를 다시 열면 leave 중인 이전 노드가 남아있을 수 있어 마지막 노드를 사용한다
  const lists = document.querySelectorAll(`[data-testid="birth-${field}-options"]`);
  return lists[lists.length - 1];
}

function optionLabels(list) {
  return [...list.querySelectorAll('button')].map((button) => button.textContent.trim());
}

async function pick(field, label) {
  const list = await openSheet(field);
  const option = [...list.querySelectorAll('button')]
    .find((button) => button.textContent.trim() === label);
  option.click();
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
    // Teleport된 시트가 leave 트랜지션 중 unmount되면 jsdom에는 잔여 노드가 남는다
    document.body.innerHTML = '';
  });

  it('년, 월, 일을 바텀시트에서 선택하면 YYYY.MM.DD 값을 만든다', async () => {
    await pick('year', '2024년');
    await pick('month', '2월');
    await pick('day', '29일');

    expect(model.value).toBe('2024.02.29');
  });

  it('일 버튼은 년과 월을 선택하기 전까지 비활성화된다', async () => {
    expect(trigger('day').disabled).toBe(true);

    await pick('year', '2024년');
    expect(trigger('day').disabled).toBe(true);

    await pick('month', '2월');
    expect(trigger('day').disabled).toBe(false);
  });

  it('선택한 연월에 맞춰 윤년의 일 목록을 제공한다', async () => {
    await pick('year', '2024년');
    await pick('month', '2월');

    const labels = optionLabels(await openSheet('day'));
    expect(labels).toContain('29일');
    expect(labels).not.toContain('30일');
  });

  it('연도 변경으로 날짜가 범위를 벗어나면 보정된 값을 한 번에 반영한다', async () => {
    await pick('year', '2024년');
    await pick('month', '2월');
    await pick('day', '29일');
    await pick('year', '2023년');

    expect(trigger('day').textContent).toContain('28일');
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
    document.body.innerHTML = '';
  });

  it('수정 화면의 기존 생년월일을 각 버튼에 반영한다', () => {
    expect(trigger('year').textContent).toContain('2023년');
    expect(trigger('month').textContent).toContain('5월');
    expect(trigger('day').textContent).toContain('12일');
  });
});

describe('BirthDateSelect 레거시 값 보호', () => {
  afterEach(() => {
    app.unmount();
    host.remove();
    document.body.innerHTML = '';
  });

  it('0패딩이 없는 날짜를 표시하되 부모 값을 임의로 덮어쓰지 않는다', async () => {
    mountPicker('2023.5.2');
    await nextTick();

    expect(trigger('year').textContent).toContain('2023년');
    expect(trigger('month').textContent).toContain('5월');
    expect(trigger('day').textContent).toContain('2일');
    expect(model.value).toBe('2023.5.2');
  });

  it('해석할 수 없는 외부 값은 placeholder로 표시하고 빈 문자열로 emit하지 않는다', async () => {
    mountPicker('legacy-date');
    await nextTick();

    expect(model.value).toBe('legacy-date');
    expect(trigger('year').textContent.trim()).toBe('년');
    expect(trigger('month').textContent.trim()).toBe('월');
    expect(trigger('day').textContent.trim()).toBe('일');
  });

  it('실제로 존재하지 않는 날짜도 빈 문자열로 emit하지 않는다', async () => {
    mountPicker('2023.02.30');
    await nextTick();

    expect(model.value).toBe('2023.02.30');
    expect(trigger('year').textContent.trim()).toBe('년');
  });
});
