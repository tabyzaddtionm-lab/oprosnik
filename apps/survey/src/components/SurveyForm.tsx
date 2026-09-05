"use client";

import { FormEvent, useMemo, useState } from "react";

import { REQUIRED_QUESTIONS, SURVEY_QUESTIONS, type SurveyAnswers, type SurveyQuestion } from "@questionhub/core/survey";

type SubmitState = "idle" | "submitting" | "success" | "error";

function isAnswered(question: SurveyQuestion, answers: SurveyAnswers): boolean {
  const value = answers[question.id];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SurveyForm() {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");

  const answeredRequired = useMemo(
    () => REQUIRED_QUESTIONS.filter((question) => isAnswered(question, answers)).length,
    [answers],
  );
  const progress = Math.round((answeredRequired / REQUIRED_QUESTIONS.length) * 100);

  function setSingle(questionId: string, value: string) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => ({ ...current, [questionId]: false }));
  }

  function toggleMultiple(question: SurveyQuestion, value: string) {
    setAnswers((current) => {
      const selected = Array.isArray(current[question.id]) ? (current[question.id] as string[]) : [];
      const isExclusive = question.exclusiveValues?.includes(value);
      let next: string[];
      if (selected.includes(value)) {
        next = selected.filter((item) => item !== value);
      } else if (isExclusive) {
        next = [value];
      } else {
        next = [...selected.filter((item) => !question.exclusiveValues?.includes(item)), value];
      }
      return { ...current, [question.id]: next };
    });
    setErrors((current) => ({ ...current, [question.id]: false }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "submitting") return;

    const missing = REQUIRED_QUESTIONS.filter((question) => !isAnswered(question, answers));
    if (missing.length > 0) {
      setErrors(Object.fromEntries(missing.map((question) => [question.id, true])));
      document.getElementById(`question-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitState("submitting");
    setSubmitError("");
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось отправить ответы");
      setSubmitState("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить ответы");
      setSubmitState("error");
    }
  }

  function restart() {
    setAnswers({});
    setErrors({});
    setSubmitError("");
    setSubmitState("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitState === "success") {
    return (
      <section className="survey-success" aria-live="polite">
        <div className="success-orbit" aria-hidden="true">
          <span><CheckIcon /></span>
        </div>
        <p className="section-index">ОТВЕТ СОХРАНЁН</p>
        <h2>Спасибо за честность</h2>
        <p>
          Ваш ответ уже учтён в общей статистике. Свободный комментарий будет добавлен в
          обезличенную сводку.
        </p>
        <button className="secondary-action" type="button" onClick={restart}>
          Заполнить ещё раз
          <ArrowIcon />
        </button>
      </section>
    );
  }

  return (
    <form className="survey-shell" onSubmit={submit} noValidate>
      <div className="survey-progress">
        <div className="progress-copy">
          <span>Заполнено</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track" aria-label={`Опрос заполнен на ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-count">{answeredRequired} из {REQUIRED_QUESTIONS.length}</span>
      </div>

      <div className="survey-intro">
        <p className="section-index">АНОНИМНЫЙ ОПРОС</p>
        <h2>Расскажите о своём опыте</h2>
        <p>
          Мы не просим имя, телефон или другие личные данные. Не указывайте их в свободных
          ответах.
        </p>
      </div>

      <div className="questions">
        {SURVEY_QUESTIONS.map((question) => {
          const value = answers[question.id];
          const selected = Array.isArray(value) ? value : [];
          return (
            <section
              className={`question ${errors[question.id] ? "question-error" : ""}`}
              id={`question-${question.id}`}
              key={question.id}
            >
              <div className="question-number">{String(question.number).padStart(2, "0")}</div>
              <div className="question-content">
                <div className="question-heading">
                  <h3>{question.title}</h3>
                  {question.required ? <span aria-label="Обязательный вопрос">*</span> : null}
                </div>
                {question.description ? <p className="question-description">{question.description}</p> : null}

                {question.type === "single" ? (
                  <div className="choice-grid choice-grid-single">
                    {question.options?.map((option) => {
                      const active = value === option.value;
                      return (
                        <button
                          className={`choice ${active ? "choice-active" : ""}`}
                          key={option.value}
                          type="button"
                          onClick={() => setSingle(question.id, option.value)}
                          aria-pressed={active}
                        >
                          <span className="radio-mark"><i /></span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {question.type === "multiple" ? (
                  <div className="choice-grid">
                    {question.options?.map((option) => {
                      const active = selected.includes(option.value);
                      return (
                        <button
                          className={`choice ${active ? "choice-active" : ""}`}
                          key={option.value}
                          type="button"
                          onClick={() => toggleMultiple(question, option.value)}
                          aria-pressed={active}
                        >
                          <span className="check-mark">{active ? <CheckIcon /> : null}</span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {question.type === "rating" ? (
                  <div className="rating-block">
                    <div className="rating-row">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const active = value === String(rating);
                        return (
                          <button
                            className={`rating-button ${active ? "rating-active" : ""}`}
                            key={rating}
                            type="button"
                            onClick={() => setSingle(question.id, String(rating))}
                            aria-label={`${rating} из 5`}
                            aria-pressed={active}
                          >
                            {rating}
                          </button>
                        );
                      })}
                    </div>
                    <div className="rating-labels">
                      <span>{question.lowLabel}</span>
                      <span>{question.highLabel}</span>
                    </div>
                    {question.notApplicable ? (
                      <button
                        className={`not-applicable ${value === question.notApplicable.value ? "not-applicable-active" : ""}`}
                        type="button"
                        onClick={() => setSingle(question.id, question.notApplicable!.value)}
                        aria-pressed={value === question.notApplicable.value}
                      >
                        {question.notApplicable.label}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {question.type === "text" ? (
                  <div className="textarea-wrap">
                    <textarea
                      value={typeof value === "string" ? value : ""}
                      maxLength={question.maxLength}
                      placeholder={question.number === 14 ? "Что стоит изменить в первую очередь?" : "Ваш комментарий"}
                      onChange={(event) => setSingle(question.id, event.target.value)}
                      aria-invalid={errors[question.id] || undefined}
                    />
                    <span>{typeof value === "string" ? value.length : 0} / {question.maxLength}</span>
                  </div>
                ) : null}

                {errors[question.id] ? (
                  <p className="field-error" role="alert">Пожалуйста, ответьте на этот вопрос</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <div className="submit-zone">
        <div>
          <p>Готово?</p>
          <span>Перед отправкой можно изменить любой ответ</span>
        </div>
        <button className="primary-action" type="submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? <span className="button-loader" /> : null}
          {submitState === "submitting" ? "Сохраняем…" : "Отправить ответы"}
          {submitState !== "submitting" ? <ArrowIcon /> : null}
        </button>
      </div>

      {submitState === "error" ? <div className="submit-error" role="alert">{submitError}</div> : null}
      <p className="privacy-caption">
        Ответ сохраняется без имени, телефона и авторизации. Повторное заполнение разрешено.
      </p>
    </form>
  );
}

