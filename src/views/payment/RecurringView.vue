<script setup>
import { ref, onMounted } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import IconRecurring from '@/components/common/icons/IconRecurring.vue'

const recurringPayments = ref([])
const isLoading = ref(true)
const showCreateForm = ref(false)

const form = ref({
  merchantName: '',
  amount: null,
  petId: '',
  category: '',
  dayOfMonth: 1,
})

onMounted(async () => {
  // TODO: fetch recurring payments from payment store/API
  isLoading.value = false
})

const handleCreate = async () => {
  // TODO: implement create recurring payment
  showCreateForm.value = false
}

const handleCancel = async (_id) => {
  // TODO: implement cancel recurring payment with confirmation
}
</script>

<template>
  <div class="recurring-page">
    <header class="page-header">
      <h1>정기 결제</h1>
      <button
        class="btn-add"
        @click="showCreateForm = !showCreateForm"
      >
        {{ showCreateForm ? '취소' : '+ 등록' }}
      </button>
    </header>

    <!-- Create Form -->
    <section
      v-if="showCreateForm"
      class="create-form card"
    >
      <h2>정기 결제 등록</h2>
      <form @submit.prevent="handleCreate">
        <div class="form-group">
          <label for="merchantName">가맹점명</label>
          <input
            id="merchantName"
            v-model="form.merchantName"
            type="text"
            placeholder="예: 바른사료 정기배송"
            required
          >
        </div>
        <div class="form-group">
          <label for="amount">금액</label>
          <input
            id="amount"
            v-model.number="form.amount"
            type="number"
            placeholder="결제 금액"
            required
          >
        </div>
        <div class="form-group">
          <label for="dayOfMonth">결제일 (매월)</label>
          <select
            id="dayOfMonth"
            v-model.number="form.dayOfMonth"
          >
            <option
              v-for="d in 28"
              :key="d"
              :value="d"
            >
              {{ d }}일
            </option>
          </select>
        </div>
        <!-- TODO: implement pet/category selection -->
        <AppButton
          type="submit"
          variant="navy"
          size="lg"
          block
        >
          등록하기
        </AppButton>
      </form>
    </section>

    <!-- Recurring Payment List -->
    <section class="recurring-section">
      <div
        v-if="isLoading"
        class="loading-state"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="recurringPayments.length === 0"
        :icon="IconRecurring"
        message="등록된 정기 결제가 없어요."
      />

      <ul
        v-else
        class="recurring-list"
      >
        <li
          v-for="payment in recurringPayments"
          :key="payment.id"
          class="recurring-item card"
        >
          <div class="payment-info">
            <h3>{{ payment.merchantName }}</h3>
            <p class="payment-meta">
              매월 {{ payment.dayOfMonth }}일
              <span v-if="payment.petName"> &middot; {{ payment.petName }}</span>
            </p>
          </div>
          <div class="payment-right">
            <p class="payment-amount">
              {{ payment.amount?.toLocaleString() }}원
            </p>
            <button
              class="btn-cancel"
              @click="handleCancel(payment.id)"
            >
              해지
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.recurring-page {
  padding: var(--space-4);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-4));
  background-color: var(--color-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.page-header h1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.btn-add {
  font-size: var(--font-sm);
  color: var(--color-gold);
  font-weight: var(--font-semibold);
  background: none;
  border: none;
  cursor: pointer;
}

.card {
  background-color: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.create-form {
  margin-bottom: var(--space-5);
}

.create-form h2 {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-1);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  box-sizing: border-box;
  background-color: var(--color-white);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
}

.recurring-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.recurring-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-info h3 {
  font-size: var(--font-md);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.payment-meta {
  font-size: var(--font-xs);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}

.payment-right {
  text-align: right;
}

.payment-amount {
  font-size: var(--font-md);
  font-weight: var(--font-bold);
  color: var(--color-navy);
}

.btn-cancel {
  font-size: var(--font-xs);
  color: var(--color-danger);
  background: none;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  margin-top: var(--space-2);
}
</style>
