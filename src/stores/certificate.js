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
    // 화면 재진입마다 다시 호출되므로, 목데이터 시딩은 최초 1회만 — 그렇지 않으면
    // 세션 중 업로드/연동/삭제로 바뀐 documents/registrationDetails가 매번 초기화됨
    async fetchPets() {
      if (USE_MOCK_DATA) {
        if (this.pets.length === 0) {
          this.pets = structuredClone(MOCK_PETS)
          this.documents = structuredClone(MOCK_PET_DOCUMENTS)
          this.registrationDetails = structuredClone(MOCK_REGISTRATION_DETAIL)
        }
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

    // 동물등록증 연동 1단계 — 간편인증(카카오톡) 요청
    // 실제로는 CODEF에 organization/loginType=5/loginTypeLevel/userName/birthDate/phoneNo를
    // 보내면 continue2Way 응답(jobIndex/threadIndex/jti/twoWayTimestamp)이 오고,
    // 사용자가 카카오톡 앱에서 승인해야 2차(추가인증) 요청으로 최종 완료된다.
    // 여기서는 실제 CODEF 연동 없이 그 대기 시간만 흉내내고, 승인이 끝났다고 가정한다.
    // 등록번호는 요청값이 아니라 응답값이라, 인증만 하면 신청인 명의의 동물이 (여러 마리면 배열로) 돌아온다.
    async requestApmsSimpleAuth({ userName, birthDate, phoneNo }) {
      if (!userName?.trim() || !birthDate?.trim() || !phoneNo?.trim()) {
        throw new Error('이름, 생년월일, 전화번호를 모두 입력해주세요.')
      }

      if (USE_MOCK_DATA) {
        // 카카오톡 승인 대기(2-way) 흉내 — 실제 폴링/웹훅 없이 지연만 재현
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const today = new Date().toISOString().slice(0, 10)
        // 이미 연동된 동물등록증이 없는 펫들을 "신청인 명의로 조회된 동물"로 흉내냄
        const linkedPetIds = new Set(
          this.documents.filter((doc) => doc.docType === 'REGISTRATION').map((doc) => doc.petId),
        )
        const candidates = this.pets
          .filter((pet) => !linkedPetIds.has(pet.petId))
          .map((pet) => ({
            petId: pet.petId,
            resRegNumber: `41000001${String(Date.now()).slice(-8)}${pet.petId.slice(-1)}`,
            commName: pet.name,
            resKind: pet.breed,
            resGender: pet.gender,
            resNeuterYN: pet.neutered === 'Y' ? 'O' : 'X',
            commBirthDate: pet.birthDate,
            resType1: pet.species === 'CAT' ? '고양이' : '개',
            resColor: '크림색',
            resOwner: userName,
            resPhoneNo: phoneNo,
            resIssueDate: today,
            resRegisterDate: today,
            resIssueOgzNm: '국가동물보호정보시스템',
            resState: '승인',
            resType: '소유',
          }))

        return candidates
      }

      // TODO: 백엔드에 "간편인증 1차/추가인증 2차" 엔드포인트가 아직 확정되지 않아 주석 처리해둠.
      // 확정되면 1차 요청 → continue2Way 확인 → 카카오톡 승인 대기 → 2차(추가인증) 요청 순으로 연결 예정.
      // return this._withRequestState(async () => {
      //   const { data } = await certificatesApi.syncRegistration({ userName, birthDate, phoneNo })
      //   return data.result
      // })
    },

    // 동물등록증 연동 2단계 — 사용자가 매칭 결과 화면에서 선택한 후보들을 저장
    async confirmApmsLink(candidates) {
      const today = new Date().toISOString().slice(0, 10)

      for (const candidate of candidates) {
        const pet = this.pets.find((p) => p.petId === candidate.petId)
        const docId = `doc-reg-${candidate.petId}`

        const detail = {
          docId,
          petId: candidate.petId,
          regNumber: candidate.resRegNumber,
          name: candidate.commName,
          breed: candidate.resKind,
          gender: candidate.resGender,
          neutered: candidate.resNeuterYN === 'O' ? 'Y' : 'N',
          birthDate: candidate.commBirthDate,
          furColor: candidate.resColor,
          weight: pet?.weight ?? 0,
          ownerName: candidate.resOwner,
          ownerPhone: candidate.resPhoneNo,
          issueDate: candidate.resIssueDate,
          registerDate: candidate.resRegisterDate,
          issueOrg: candidate.resIssueOgzNm,
          regState: candidate.resState,
          regType: candidate.resType,
          lastSyncedAt: today,
        }
        this.registrationDetails = { ...this.registrationDetails, [docId]: detail }

        if (pet) pet.regNumber = candidate.resRegNumber

        const newDoc = {
          docId,
          petId: candidate.petId,
          docName: `${candidate.commName} · 동물등록증`,
          docType: 'REGISTRATION',
          fileUrl: '',
          issuedDate: candidate.resIssueDate,
          createdAt: new Date().toISOString(),
        }
        this.documents = [newDoc, ...this.documents.filter((doc) => doc.docId !== docId)]
      }

      if (this.selectedPetId) {
        await this.fetchCertificates(this.selectedPetId)
      }
    },

    // 동물등록증 재동기화 — connectedId를 이미 확보한 상태(최초 연동 완료)라는 전제로,
    // 신원확인 폼 없이 바로 재조회한다는 흐름만 흉내냄. 값 자체는 크게 바뀌지 않고
    // lastSyncedAt만 갱신 — "정보가 바뀌면 자동 갱신"을 사용자가 수동으로 트리거하는 액션.
    async resyncRegistration(docId) {
      if (USE_MOCK_DATA) {
        const existing = this.registrationDetails[docId]
        if (!existing) return null

        // 카카오톡 재인증 없이 connectedId로 바로 재조회한다는 전제라 대기 시간이 짧음
        await new Promise((resolve) => setTimeout(resolve, 800))

        const updated = { ...existing, lastSyncedAt: new Date().toISOString().slice(0, 10) }
        this.registrationDetails = { ...this.registrationDetails, [docId]: updated }
        if (this.detail?.docId === docId) this.detail = updated
        return updated
      }

      // TODO: 백엔드에 재동기화 엔드포인트가 아직 확정되지 않아 주석 처리해둠.
      // return this._withRequestState(async () => {
      //   const { data } = await certificatesApi.resyncRegistration(docId)
      //   this.detail = data.result ?? null
      //   return this.detail
      // })
    },

    // 동물등록증 연동 해제(삭제)
    async deleteRegistration(docId) {
      if (USE_MOCK_DATA) {
        const doc = this.documents.find((d) => d.docId === docId)
        this.documents = this.documents.filter((d) => d.docId !== docId)

        const nextDetails = { ...this.registrationDetails }
        delete nextDetails[docId]
        this.registrationDetails = nextDetails

        const pet = doc ? this.pets.find((p) => p.petId === doc.petId) : null
        if (pet) pet.regNumber = ''

        if (this.registrationDoc?.docId === docId) this.registrationDoc = null
        if (this.detail?.docId === docId) this.detail = null
        return
      }

      // TODO: 백엔드에 삭제 엔드포인트가 아직 확정되지 않아 주석 처리해둠.
      // return this._withRequestState(async () => {
      //   await certificatesApi.deleteRegistration(docId)
      //   if (this.selectedPetId) await this.fetchCertificates(this.selectedPetId)
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
          // 실제 백엔드가 없어서 서버 파일 URL 대신, 방금 고른 파일을 그 자리에서
          // 미리보기할 수 있도록 브라우저 로컬 objectURL을 사용함(새로고침하면 사라짐)
          fileUrl: URL.createObjectURL(file),
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
          fileUrl: URL.createObjectURL(file),
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

    // 접종증명서/진료확인서 삭제 — 두 타입 다 문서 배열에서 제거하는 것만 하면 되는 단순한 구조라
    // 동물등록증 해제(deleteRegistration)와 달리 하나의 액션으로 공용 처리
    async deleteDocument(docId) {
      if (USE_MOCK_DATA) {
        const doc = this.documents.find((d) => d.docId === docId)
        // 업로드 시 만든 blob: objectURL은 브라우저가 알아서 회수하지 않으므로 직접 해제
        if (doc?.fileUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(doc.fileUrl)
        }

        this.documents = this.documents.filter((d) => d.docId !== docId)
        this.vaccinationDocs = this.vaccinationDocs.filter((d) => d.docId !== docId)
        this.medicalDocs = this.medicalDocs.filter((d) => d.docId !== docId)
        return
      }

      // TODO: 백엔드에 삭제 엔드포인트가 아직 확정되지 않아 주석 처리해둠.
      // return this._withRequestState(async () => {
      //   await certificatesApi.deleteDocument(docId)
      //   if (this.selectedPetId) await this.fetchCertificates(this.selectedPetId)
      // })
    },
  },
})
