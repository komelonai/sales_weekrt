// ──────────────────────────────────────────────────────────────
// Firebase 초기화 + DataStore 팩토리
// 모든 페이지에서 공유 사용 (firebase-config.js 이후에 로드)
// ──────────────────────────────────────────────────────────────

firebase.initializeApp(FIREBASE_CONFIG);
const _db = firebase.firestore();

/**
 * 각 페이지에서 호출: const DataStore = createDataStore('page1');
 * Firestore 저장 실패 시 localStorage로 자동 대체 (오프라인 안전망)
 */
function createDataStore(pageId) {
  const LOCAL_KEY = 'weeklyReport_' + pageId;
  const docRef = _db.collection('weeklyReports').doc(pageId);

  return {
    /** 데이터 저장 (Firestore 우선, 실패 시 localStorage) */
    async save(data) {
      try {
        await docRef.set({
          json: JSON.stringify(data),
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[DataStore] Firestore 저장 실패 → localStorage 대체:', e.message);
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (_) {}
      }
    },

    /** 데이터 불러오기 (Firestore 우선, 실패 시 localStorage) */
    async load() {
      try {
        const snap = await docRef.get();
        if (snap.exists && snap.data().json) {
          return JSON.parse(snap.data().json);
        }
        return null;
      } catch (e) {
        console.warn('[DataStore] Firestore 불러오기 실패 → localStorage 대체:', e.message);
        try {
          const r = localStorage.getItem(LOCAL_KEY);
          return r ? JSON.parse(r) : null;
        } catch (_) { return null; }
      }
    },

    /** 데이터 삭제 */
    async clear() {
      try { await docRef.delete(); } catch (e) {
        console.warn('[DataStore] Firestore 삭제 실패 → localStorage 대체:', e.message);
        try { localStorage.removeItem(LOCAL_KEY); } catch (_) {}
      }
    }
  };
}
