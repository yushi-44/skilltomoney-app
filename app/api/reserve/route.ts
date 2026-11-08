import { courses } from "@/data/courses";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, course, name, phone, people, courseId } = body;

    // 필수 입력값 검증
    if (!course || !name || !phone) {
      return Response.json(
        { success: false, message: "강좌 이름, 신청자 이름, 연락처는 필수 항목입니다." },
        { status: 400 }
      );
    }

    const numPeople = Math.max(1, parseInt(people, 10) || 1);

    // 파이썬 prices 딕셔너리 및 강좌 데이터 기반 수강료 조회
    const prices: Record<string, number> = {
      "AI 자동화": 35000,
      "숏폼 편집": 45000,
      "엑셀 실무": 30000,
      "스마트스토어": 40000,
      "블로그 수익화": 38000,
    };

    const targetCourse = courses.find(
      (c) => c.name === course || c.id === Number(courseId)
    );

    const unitPrice =
      targetCourse?.price ?? (prices[course] !== undefined ? prices[course] : 0);
    const total = unitPrice * numPeople;

    // 파이썬 열 순서 규칙: keys = ["date", "course", "name", "phone", "people", "total"]
    const keys = ["date", "course", "name", "phone", "people", "total"] as const;
    const rsv: Record<string, string | number> = {
      date: date || (targetCourse ? targetCourse.date : "2026-11-07"),
      course,
      name,
      phone,
      people: numPeople,
      total,
    };

    // 시트의 한 행으로 추가될 row 리스트
    const row = keys.map((key) => rsv[key]);

    const payload = {
      ...rsv,
      row,
    };

    // .env의 SHEET_URL 주소로 시트 주소가 브라우저에 보이지 않게 서버 쪽에서 전송
    const sheetUrl =
      process.env.SHEET_URL ||
      "https://script.google.com/macros/s/AKfycbz4QoAdULLpo-Uw7ck9LGTRem-emzYPuHILyfl01M194PdGgsc7IYyrMkl2xLMTTpQFzg/exec";

    if (sheetUrl && sheetUrl.trim().startsWith("http")) {
      try {
        await fetch(sheetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          redirect: "follow",
        });
      } catch (sheetError) {
        console.error("구글 시트 전송 중 오류 발생:", sheetError);
        // 시트 전송에 실패하더라도 서버 자체 오류로 중단되지 않고 진행
      }
    } else {
      console.warn("⚠️ .env 파일에 SHEET_URL이 설정되지 않았거나 올바르지 않습니다.");
    }

    return Response.json({
      success: true,
      message: "예약 신청이 완료되었습니다.",
      data: payload,
    });
  } catch (error) {
    console.error("예약 처리 API 오류:", error);
    return Response.json(
      { success: false, message: "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

