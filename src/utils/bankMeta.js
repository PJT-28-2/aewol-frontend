import bankKbLogo from '@/assets/images/banks/bank-kb.png';
import bankShinhanLogo from '@/assets/images/banks/bank-shinhan.png';
import bankWooriLogo from '@/assets/images/banks/bank-woori.png';
import bankHanaLogo from '@/assets/images/banks/bank-hana.png';
import bankNhLogo from '@/assets/images/banks/bank-nh.png';
import bankKakaobankLogo from '@/assets/images/banks/bank-kakaobank.png';
import bankTossLogo from '@/assets/images/banks/bank-toss.png';
import bankIbkLogo from '@/assets/images/banks/bank-ibk.png';

/**
 * 은행 코드 <-> 표시 정보 매핑.
 * 실제 백엔드 은행 코드값이 확정되면 이 파일의 key만 맞춰주면 됩니다.
 */
export const BANK_META = {
  KB: { label: 'KB', name: 'KB국민은행', bg: 'bg-(--color-brand-kb)', text: 'text-(color:--color-brand-kb-text)', logo: bankKbLogo },
  SHINHAN: { label: '신한', name: '신한은행', bg: 'bg-(--color-brand-shinhan)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankShinhanLogo },
  WOORI: { label: '우리', name: '우리은행', bg: 'bg-(--color-brand-woori)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankWooriLogo },
  HANA: { label: '하나', name: '하나은행', bg: 'bg-(--color-brand-hana)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankHanaLogo },
  NH: { label: 'NH', name: 'NH농협은행', bg: 'bg-(--color-brand-nh)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankNhLogo },
  KAKAOBANK: { label: '카뱅', name: '카카오뱅크', bg: 'bg-(--color-brand-kakaobank)', text: 'text-(color:--color-brand-kakaobank-text)', logo: bankKakaobankLogo },
  TOSS: { label: 'toss', name: '토스뱅크', bg: 'bg-(--color-brand-toss)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankTossLogo },
  IBK: { label: 'IBK', name: 'IBK기업은행', bg: 'bg-(--color-brand-ibk)', text: 'text-(color:--color-brand-text-on-dark)', logo: bankIbkLogo },
};

// 금융결제원 표준 은행코드로 내려오는 경우까지 커버 (백엔드가 문자 코드 대신 숫자 코드를 쓸 수도 있어서)
const BANK_CODE_ALIASES = {
  '004': 'KB',
  '088': 'SHINHAN',
  '020': 'WOORI',
  '081': 'HANA',
  '011': 'NH',
  '090': 'KAKAOBANK',
  '092': 'TOSS',
  '003': 'IBK',
};

export const BANK_LIST = Object.entries(BANK_META).map(([code, meta]) => ({
  code,
  ...meta,
}));

export function getBankMeta(bankCode, fallbackName = '') {
  const canonicalKey = BANK_META[bankCode] ? bankCode : BANK_CODE_ALIASES[bankCode];
  if (canonicalKey && BANK_META[canonicalKey]) {
    return BANK_META[canonicalKey];
  }
  const displayName = fallbackName || bankCode || '알 수 없는 은행';
  return {
    label: displayName.slice(0, 2),
    name: displayName,
    bg: 'bg-(--color-gray-400)',
    text: 'text-(color:--color-contrast)',
  };
}

export function getBankName(bankCode) {
  return getBankMeta(bankCode).name;
}

/** 잔액 등 숫자를 "482,600원" 형태로 표기 */
export function formatWon(amount) {
  if (amount === null || amount === undefined) return '0원';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
}

/** 계좌번호 마스킹 표시: 서버가 이미 마스킹해서 내려주면 그대로 사용 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '';
  return accountNumber;
}
