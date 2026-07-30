import { defineStore } from 'pinia'
import { certificatesApi } from '@/api/certificates'
import {
  USE_MOCK_DATA,
  MOCK_PETS,
  MOCK_PET_DOCUMENTS,
  MOCK_REGISTRATION_DETAIL,
} from '@/utils/mockData'

export const useCertificateStore = defineStore('certificate', {
  state: () => ({
    // 상단 펫 탭 — 지금은 이 스토어에서 목데이터로 자체 관리 (추후 usePetStore 연동 예정)
    pets: [],
    selectedPetId: null,

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
        const docs = MOCK_PET_DOCUMENTS.filter((doc) => doc.petId === petId)
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
        this.detail = MOCK_REGISTRATION_DETAIL[docId] ?? null
        return this.detail
      }
      return this._withRequestState(async () => {
        const { data } = await certificatesApi.getDetail(docId)
        this.detail = data.result ?? null
        return this.detail
      })
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
