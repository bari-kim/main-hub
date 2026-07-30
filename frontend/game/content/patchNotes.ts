export type PatchNote = {
  id: string;
  title: string;
  date: string;
  summary: string;
  details: string[];
};

export type PatchNotesResponse = {
  monthPatchCount: number;
  patchNotes: PatchNote[];
};

const FALLBACK_RESPONSE: PatchNotesResponse = {
  monthPatchCount: 3,
  patchNotes: [
    {
      id: "v0-0-1",
      title: "TitleScene 입장 연출",
      date: "2026-07-30",
      summary: "시작 화면, 문 열림 연출, 페이드 전환 흐름을 추가했다.",
      details: [
        "어두운 시작 화면과 중앙 문 연출을 구현했다.",
        "PRESS ENTER 안내와 최초 입력 처리 구조를 추가했다.",
        "문 열림 효과음, 화이트 페이드, RoomScene 전환 흐름을 연결했다.",
      ],
    },
    {
      id: "v0-0-2",
      title: "WorkshopScene 기본 구조",
      date: "2026-07-30",
      summary: "작업실 배경, 문, 바닥, 플레이어 배치 구조를 정리했다.",
      details: [
        "문과 바닥, 벽을 Scene 내부에서 관리하도록 정리했다.",
        "리사이즈 시 화면 높이 기준으로 스케일이 갱신되도록 했다.",
        "문 상호작용 락과 hover 종료 지연 로직을 분리했다.",
      ],
    },
    {
      id: "v0-0-3",
      title: "게시판 임시 데이터 연결",
      date: "2026-07-30",
      summary: "게시판 이미지 선택과 패치 노트 모달 표시 구조를 준비했다.",
      details: [
        "최근 30일 패치 수에 따라 게시판 상태를 바꾸는 구조를 추가했다.",
        "notice_empty, notice01, notice02 에셋을 연결했다.",
        "게시판 클릭 시 패치내역 모달을 열 수 있게 준비했다.",
      ],
    },
  ],
};

let hasLoggedApiEnvState = false;

export async function loadPatchNotes() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!hasLoggedApiEnvState) {
    hasLoggedApiEnvState = true;
    console.warn(
      `NEXT_PUBLIC_API_URL loaded: ${apiBaseUrl ? "configured" : "missing"}`,
    );
  }

  if (!apiBaseUrl) {
    return FALLBACK_RESPONSE;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/patch-notes`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`Patch notes request failed with status ${response.status}.`);
      return FALLBACK_RESPONSE;
    }

    const data = (await response.json()) as Partial<PatchNotesResponse>;

    return {
      monthPatchCount: Number(data.monthPatchCount ?? 0),
      patchNotes: Array.isArray(data.patchNotes) ? data.patchNotes : [],
    };
  } catch {
    console.warn("Patch notes request failed. Using local fallback patch notes.");
    return FALLBACK_RESPONSE;
  }
}
