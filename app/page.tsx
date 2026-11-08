"use client";

import { useState } from "react";
import { courses as initialCourses } from "@/data/courses";

// 강좌 기본 데이터 타입 정의 (data/courses.js 규격)
export interface Course {
  id: number;
  name: string;
  price: number;
  seat: number;
  booked: number;
  date: string;
  tags: string[];
}

export default function Home() {
  // 브라우저 저장소(localStorage) 연동 초기 상태 (data/courses.js 기본값 불러오기)
  const [courses, setCourses] = useState<Course[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedData = localStorage.getItem("skilltomoney_courses_v5");
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch {
        // 접근 불가 시 기본값 유지
      }
    }
    return initialCourses;
  });

  // "예약 가능한 강좌만 보기" 필터 상태 (파이썬 코드의 only_open = False 반영)
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // 예약 신청 모달 상태 (선택된 강좌 객체)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // 모달 입력 폼 상태
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantPeople, setApplicantPeople] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // 예약 변경 및 localStorage 동기화
  const saveCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("skilltomoney_courses_v5", JSON.stringify(newCourses));
      } catch {
        // 무시
      }
    }
  };

  // 강좌 카드의 [예약하기] 버튼 클릭 시 모달 열기
  const handleOpenModal = (course: Course) => {
    const remainingSeats = course.seat - course.booked;
    if (remainingSeats <= 0) {
      alert(`[${course.name}] 강좌는 정원이 가득 차 마감되었습니다.`);
      return;
    }
    setSelectedCourse(course);
    setApplicantName("");
    setApplicantPhone("");
    setApplicantPeople(1);
    setFormError("");
  };

  // 모달 닫기
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedCourse(null);
    setFormError("");
  };

  // 모달의 [신청] 버튼 클릭 핸들러 -> 서버 API(/api/reserve)로 전송
  const handleSubmitReservation = async () => {
    if (!selectedCourse) return;

    // 1. 이름이 비어 있는지 검사
    if (!applicantName.trim()) {
      setFormError("이름을 입력해 주세요.");
      return;
    }

    // 2. 인원이 남은 자리보다 많은지 검사
    const remainingSeats = selectedCourse.seat - selectedCourse.booked;
    if (applicantPeople > remainingSeats) {
      setFormError(`신청 인원이 남은 자리(${remainingSeats}석)보다 많습니다.`);
      return;
    }

    if (applicantPeople < 1) {
      setFormError("신청 인원은 1명 이상이어야 합니다.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      // Next.js 서버 쪽 API(/api/reserve)로 데이터 전송 (결제 금액 total은 서버에서 계산)
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          course: selectedCourse.name,
          date: selectedCourse.date,
          name: applicantName.trim(),
          phone: applicantPhone.trim(),
          people: applicantPeople,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 화면의 강좌 예약 인원(booked) 업데이트 및 로컬스토리지 저장
        const updated = courses.map((c) => {
          if (c.id === selectedCourse.id) {
            return { ...c, booked: c.booked + applicantPeople };
          }
          return c;
        });
        saveCourses(updated);

        // 성공 안내 문구
        alert("예약 신청이 완료되었습니다");

        setSelectedCourse(null);
      } else {
        setFormError(result.message || "예약 처리 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error(err);
      setFormError("서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 데이터 초기화 핸들러 (실습용)
  const handleResetData = () => {
    if (confirm("강좌 예약 데이터를 처음 상태로 되돌리시겠습니까?")) {
      saveCourses(initialCourses);
    }
  };

  // 화면에 보여줄 강좌 목록 필터링 (체크 시 남은 자리가 있는 강좌만 필터링)
  const displayedCourses = courses.filter((course) => {
    if (onlyAvailable) {
      return course.seat - course.booked > 0;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b1329] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900">
      {/* 상단 네비게이션 / 헤더 */}
      <header className="border-b border-white/10 px-6 py-4 bg-[#080d1c]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-xl font-black tracking-tight">
              스킬투머니
            </span>
            <span className="text-xs text-amber-300/80 font-medium px-2.5 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10">
              원데이 클래스
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <a
              href="/lab04.html"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
            >
              🐍 4장 실습실
            </a>
            <a
              href="/lab05.html"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
            >
              🚀 5장 실습실
            </a>
            <a
              href="/lab06.html"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 transition-colors"
            >
              📊 6장 실습실
            </a>
            <button
              onClick={handleResetData}
              title="초기 데이터로 리셋"
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              예약 초기화
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-12 md:py-16 flex flex-col items-center">
        {/* 서비스 소개 헤더 */}
        <section className="text-center mb-10 md:mb-14">
          <p className="text-amber-400 text-sm md:text-base font-semibold tracking-wider uppercase mb-2">
            Skill to Money
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            스킬투머니
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium">
            배운 기술이 돈이 되는 원데이 클래스
          </p>
        </section>

        {/* 강좌 카드 목록 영역 */}
        <section className="w-full">
          {/* 강좌 목록 상단 옵션: "예약 가능한 강좌만 보기" 체크 상자 */}
          <div className="w-full flex items-center justify-between mb-6 flex-wrap gap-4 pb-4 border-b border-white/10">
            <div className="text-sm text-slate-400 font-medium">
              총 <span className="text-amber-400 font-bold">{displayedCourses.length}</span>개의 강좌
              {onlyAvailable && (
                <span className="text-xs text-amber-300/80 ml-2 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  예약 가능 강좌 필터링 중
                </span>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-200 cursor-pointer select-none bg-[#15203b] py-2.5 px-4 rounded-xl border border-white/10 hover:border-amber-400/40 transition-colors">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
              <span>예약 가능한 강좌만 보기</span>
            </label>
          </div>

          {/* 강좌 목록 표시 */}
          {displayedCourses.length === 0 ? (
            <div className="w-full text-center py-16 bg-[#15203b]/40 border border-white/5 rounded-2xl">
              <p className="text-slate-400 text-base font-medium">
                현재 예약 가능한 강좌가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCourses.map((course) => {
                // 남은 좌석 계산 (정원 seat - 예약 booked)
                const remainingSeats = course.seat - course.booked;
                // 1. 남은 좌석이 0석이면 마감
                const isSoldOut = remainingSeats <= 0;
                // 2. 남은 좌석이 1~3석이면 마감 임박
                const isImminent = remainingSeats >= 1 && remainingSeats <= 3;

                return (
                  <div
                    key={course.id}
                    className={`bg-[#15203b] border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-200 hover:-translate-y-1 group ${
                      isSoldOut
                        ? "border-slate-700 opacity-75"
                        : isImminent
                        ? "border-red-500/50 hover:border-red-500 shadow-red-500/5"
                        : "border-amber-400/20 hover:border-amber-400/60 hover:shadow-amber-400/5"
                    }`}
                  >
                    <div>
                      {/* 상단 클래스 번호 및 상태 뱃지 */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/20">
                          CLASS 0{course.id}
                        </span>

                        {/* 상태 뱃지: 마감 / 마감 임박(빨간색) / 모집중 */}
                        {isSoldOut ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-700/80 text-slate-300 border border-slate-600">
                            마감
                          </span>
                        ) : isImminent ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse">
                            마감 임박
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            모집중
                          </span>
                        )}
                      </div>

                      {/* 강좌 이름 */}
                      <h2 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors mb-2.5">
                        {course.name}
                      </h2>

                      {/* 강좌 이름 바로 아래 작은 배지 (tags) */}
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {course.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/25 inline-flex items-center"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 강좌 일시 */}
                      <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                        <span>📅</span> 일시: {course.date}
                      </p>

                      {/* 수강료 */}
                      <div className="mb-6">
                        <span className="text-2xl md:text-3xl font-extrabold text-amber-400">
                          {course.price.toLocaleString()}
                        </span>
                        <span className="text-slate-300 text-sm ml-1 font-medium">
                          원
                        </span>
                      </div>

                      {/* 남은 좌석 정보 (정원 seat - 예약 booked으로 계산) */}
                      <div className="bg-[#0b1329]/80 rounded-xl py-3.5 px-4 mb-6 border border-white/10 text-center">
                        <p className="text-sm font-medium text-slate-200">
                          남은 좌석{" "}
                          <span
                            className={`font-bold ${
                              isSoldOut
                                ? "text-slate-400"
                              : isImminent
                              ? "text-red-500 font-extrabold"
                              : "text-amber-300"
                            }`}
                          >
                            {remainingSeats}석
                          </span>{" "}
                          / 정원 {course.seat}명
                        </p>
                        {/* 마감 임박 또는 마감 시 안내 문구 */}
                        {isImminent && (
                          <p className="text-xs font-bold text-red-500 mt-1.5">
                            마감 임박 ({remainingSeats}석 남음)
                          </p>
                        )}
                        {isSoldOut && (
                          <p className="text-xs font-medium text-slate-400 mt-1.5">
                            마감되었습니다
                          </p>
                        )}
                      </div>
                    </div>

                    {/* [예약하기] 버튼: 클릭 시 예약 신청 모달 열기 */}
                    <button
                      onClick={() => handleOpenModal(course)}
                      disabled={isSoldOut}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-base transition-all duration-150 ${
                        isSoldOut
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60"
                          : "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:shadow-amber-400/20 active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {isSoldOut ? "예약 마감" : "예약하기"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* 예약 신청 모달 창 */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#0f1c35] border border-amber-400/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 상단 헤더 */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div>
                <h3 className="text-xl font-extrabold text-amber-300">
                  원데이 강좌 예약 신청
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  신청자 정보를 입력해 주세요.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white text-2xl font-bold leading-none p-1 cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 입력 폼 */}
            <div className="flex flex-col gap-4 text-sm">
              {/* 강좌 이름 (자동 채움) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  강좌 이름
                </label>
                <input
                  type="text"
                  value={selectedCourse.name}
                  readOnly
                  className="w-full bg-[#080d1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 font-bold focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* 강좌 날짜 (자동 채움) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  강좌 날짜
                </label>
                <input
                  type="text"
                  value={selectedCourse.date}
                  readOnly
                  className="w-full bg-[#080d1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 font-medium focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* 이름 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  신청자 이름 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#080d1c] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 연락처 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  연락처 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="예: 010-1234-5678"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#080d1c] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 인원(숫자) 입력 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    신청 인원 (숫자) <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-xs text-amber-300/80">
                    남은 자리: {selectedCourse.seat - selectedCourse.booked}석
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={selectedCourse.seat - selectedCourse.booked}
                  value={applicantPeople}
                  onChange={(e) => {
                    setApplicantPeople(parseInt(e.target.value, 10) || 0);
                    setFormError("");
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-[#080d1c] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors"
                />
              </div>

              {/* 안내 문구 (이름 미입력 또는 남은 자리 초과 시 표시) */}
              {formError && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* 하단 버튼 ([신청], [닫기]) */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSubmitReservation}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md hover:shadow-amber-400/20 active:scale-[0.98] transition-all cursor-pointer ${
                  isSubmitting ? "opacity-70 cursor-wait" : ""
                }`}
              >
                {isSubmitting ? "저장 중..." : "신청"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 푸터 */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© 2026 스킬투머니 (Skill to Money). All rights reserved.</p>
      </footer>
    </div>
  );
}
