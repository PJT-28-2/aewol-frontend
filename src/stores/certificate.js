import { defineStore } from 'pinia'
import { certificatesApi } from '@/api/certificates'
import {
  USE_MOCK_DATA,
  MOCK_PETS,
  MOCK_PET_DOCUMENTS,
  MOCK_REGISTRATION_DETAIL,
} from '@/utils/mockData'

const REG_NUMBER_PATTERN = /^(\d{12}|\d{15})$/

export const useCertificateStore = defineStore('certificate', {
  state: () => ({
    // 상단 펫 탭 — 지금은 이 스토어에서 목데이터로 자체 관리 (추후 usePetStore 연동 예정)
    pets: [],
    selectedPetId: null,

    // mock 모드에서 세션 동안 유지되는 문서 전체 목록 (업로드/연동으로 추가된 항목 포함)
    documents: [],
    // GET /api/certificates/{doc_id} 상세 응답 목데이터, key: docId
    registrationDetails: {},

    registrationDoc: null,
    vaccinationDocs: [],
    medicalDocs: [],
    detail: null,

    pendingRequestCount: 0,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.pendingRequestCount > 0,
    selectedPet: (state) =>
      state.pets.find((pet) => pet.petId === state.selectedPetId) ?? null,
  },

  actions: {
    async _withRequestState(request) {
      this.pendingRequestCount += 1
      this.error = null
      try {
        return await request()
      } catch (err) {
        this.error = err
        throw err
      } finally {
        this.pendingRequestCount -= 1
      }
    },

    // 사용자가 키우는 반려동물 전체를 상단 탭에 노출
    async fetchPets() {
      if (USE_MOCK_DATA) {
        this.pets = structuredClone(MOCK_PETS)
        this.documents = structuredClone(MOCK_PET_DOCUMENTS)
        this.registrationDetails = structuredClone(MOCK_REGISTRATION_DETAIL)
        if (!this.selectedPetId) {
          this.selectedPetId = this.pets[0]?.petId ?? null
        }
        return
      }
      // TODO: 백엔드 연동 시 GET /api/pets 결과로 교체
    },

    async selectPet(petId) {
      this.selectedPetId = petId
      await this.fetchCertificates(petId)
    },

    // GET /api/certificates
    async fetchCertificates(petId) {
      if (USE_MOCK_DATA) {
        const docs = this.documents.filter((doc) => doc.petId === petId)
        this.registrationDoc = docs.find((doc) => doc.docType === 'REGISTRATION') ?? null
        this.vaccinationDocs = docs.filter((doc) => doc.docType === 'VACCINATION')
        this.medicalDocs = docs.filter((doc) => doc.docType === 'MEDICAL_CONFIRMATION')
        return
      }
      await this._withRequestState(async () => {
        const { data } = await certificatesApi.getList(petId)
        const docs = data.result ?? []
        this.registrationDoc = docs.find((doc) => doc.docType === 'REGISTRATION') ?? null
        this.vaccinationDocs = docs.filter((doc) => doc.docType === 'VACCINATION')
        this.medicalDocs = docs.filter((doc) => doc.docType === 'MEDICAL_CONFIRMATION')
      })
    },

    // GET /api/certificates/{doc_id} — 동물등록증 상세
    // APMS를 매번 라이브 호출하는 게 아니라, 연동 시점에 이미 DB에 저장해둔 값을 조회하는 API라는 전제
    async fetchCertificateDetail(docId) {
      if (USE_MOCK_DATA) {
        this.detail = this.registrationDetails[docId] ?? null
        return this.detail
      }
      return this._withRequestState(async () => {
        const { data } = await certificatesApi.getDetail(docId)
        this.detail = data.result ?? null
        return this.detail
      })
    },

    // 동물등록증 연동 — pet.regNumber가 이미 있으면 그 값을 그대로 재사용하고(확인만 받음),
    // 없으면 화면에서 새로 입력받은 값을 사용. 조회 키(regNumber)만 요청값이고
    // 나머지 필드(품종·생년월일·소유자 등)는 연동 응답으로 채워져 DB에 저장된다는 전제.
    async linkRegistration(petId, regNumber) {
      if (!REG_NUMBER_PATTERN.test(regNumber)) {
        throw new Error('동물등록번호는 12자리(인식표) 또는 15자리(무선전자인식장치) 숫자여야 해요.')
      }

      if (USE_MOCK_DATA) {
        const pet = this.pets.find((p) => p.petId === petId)
        const docId = `doc-reg-${petId}`
        const today = new Date().toISOString().slice(0, 10)

        // CODEF 샌드박스는 입력값과 무관하게 상품별로 정해진 고정 응답을 준다는 전제라,
        // 데모 화면이 자연스럽도록 pet에 이미 있는 정보를 그대로 재사용해 응답을 흉내냄.
        // 실제 연동 시엔 이 값들이 CODEF 응답 그대로로 대체됨.
        const detail = {
          docId,
          petId,
          regNumber,
          name: pet?.name ?? '',
          breed: pet?.breed ?? '',
          gender: pet?.gender ?? 'MALE',
          neutered: pet?.neutered ?? 'Y',
          birthDate: pet?.birthDate ?? today,
          furColor: '크림색',
          weight: pet?.weight ?? 0,
          ownerName: '김애월',
          registeredDate: today,
          issueOrg: '국가동물보호정보시스템',
          lastSyncedAt: today,
        }
        this.registrationDetails = { ...this.registrationDetails, [docId]: detail }

        if (pet) pet.regNumber = regNumber

        const newDoc = {
          docId,
          petId,
          docName: `${pet?.name ?? ''} · 동물등록증`,
          docType: 'REGISTRATION',
          fileUrl: '',
          issuedDate: today,
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents.filter((doc) => doc.docId !== docId)]
        this.registrationDoc = newDoc

        return newDoc
      }

      // TODO: 백엔드에 "연동" 엔드포인트가 아직 확정되지 않아 주석 처리해둠.
      // 확정되면 아래처럼 연결 예정 (경로/바디는 추정치 — certificatesApi.syncRegistration 참고)
      // return this._withRequestState(async () => {
      //   const { data } = await certificatesApi.syncRegistration(petId, regNumber)
      //   await this.fetchCertificates(petId)
      //   return data.result
      // })
    },

    // POST /api/certificates/vaccination
    async uploadVaccination(petId, file) {
      if (USE_MOCK_DATA) {
        const newDoc = {
          docId: `doc-vac-${Date.now()}`,
          petId,
          docName: file.name,
          docType: 'VACCINATION',
          fileUrl: '',
          issuedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents]
        this.vaccinationDocs = [newDoc, ...this.vaccinationDocs]
        return newDoc
      }
      return this._withRequestState(async () => {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await certificatesApi.uploadVaccination(petId, formData)
        await this.fetchCertificates(petId)
        return data.result
      })
    },

    // POST /api/certificates/medical-confirmation
    async uploadMedicalConfirmation(petId, file) {
      if (USE_MOCK_DATA) {
        const newDoc = {
          docId: `doc-med-${Date.now()}`,
          petId,
          docName: file.name,
          docType: 'MEDICAL_CONFIRMATION',
          fileUrl: '',
          issuedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents]
        this.medicalDocs = [newDoc, ...this.medicalDocs]
        return newDoc
      }
      return this._withRequestState(async () => {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await certificatesApi.uploadMedicalConfirmation(petId, formData)
        await this.fetchCertificates(petId)
        return data.result
      })
    },
  },
})
