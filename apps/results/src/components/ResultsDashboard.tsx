"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";

import type { StoredResponse, SurveyAnalytics } from "@questionhub/core/analytics";
import type { SurveyReportRecord } from "@questionhub/core/db";
import { optionLabel, SURVEY_QUESTIONS } from "@questionhub/core/survey";

interface ResultsPayload {
  cycle: string;
  analytics: SurveyAnalytics;
  report: SurveyReportRecord;
  responses: StoredResponse[];
}

type Screen = "checking" | "login" | "dashboard";

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Ещё не обновлялось";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sentimentLabel(status: string, sentiment: string | null): string {
  if (status === "pending") return "Ожидает ИИ";
  if (status === "not_required") return "Без текста";
  return {
    positive: "Положительно",
    neutral: "Нейтрально",
    negative: "Негативно",
    mixed: "Смешанно",
  }[sentiment || ""] || "Обработано";
}

function ResponseAnswer({ response, questionId }: { response: StoredResponse; questionId: string }) {
  const question = SURVEY_QUESTIONS.find((item) => item.id === questionId);
  if (!question) return null;
  const value = question.type === "text" ? response.freeText[questionId] : response.answers[questionId];
  if (!value || (Array.isArray(value) && value.length === 0)) return <span className="answer-empty">Нет ответа</span>;
  if (Array.isArray(value)) {
    return <span>{value.map((item) => optionLabel(questionId, item)).join(", ")}</span>;
  }
  if (question.type === "rating" && /^[1-5]$/.test(value)) return <span>{value} из 5</span>;
  if (question.type === "single") return <span>{optionLabel(questionId, value)}</span>;
  return <span>{value}</span>;
}

export function ResultsDashboard() {
  const [screen, setScreen] = useState<Screen>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const autoAnalysisAttempted = useRef(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/results", { cache: "no-store" });
      if (response.status === 401) {
        setScreen("login");
        setData(null);
        return;
      }
      const payload = (await response.json()) as ResultsPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Не удалось загрузить результаты");
      setData(payload);
      setScreen("dashboard");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Не удалось загрузить результаты");
      setScreen("dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const response = await fetch("/api/results/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Не удалось войти");
      setPassword("");
      await fetchResults();
    } catch (loginFailure) {
      setLoginError(loginFailure instanceof Error ? loginFailure.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/results/logout", { method: "POST" });
    setData(null);
    setScreen("login");
  }

  const refreshAi = useCallback(async () => {
    setAnalyzing(true);
    setError("");
    try {
      const response = await fetch("/api/results/analyze", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Не удалось обновить ИИ-сводку");
      await fetchResults();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Не удалось обновить ИИ-сводку");
    } finally {
      setAnalyzing(false);
    }
  }, [fetchResults]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchResults(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchResults]);

  useEffect(() => {
    if (
      screen !== "dashboard" ||
      !data ||
      data.analytics.pendingAi === 0 ||
      autoAnalysisAttempted.current ||
      analyzing
    ) return;
    autoAnalysisAttempted.current = true;
    const timer = window.setTimeout(() => void refreshAi(), 0);
    return () => window.clearTimeout(timer);
  }, [screen, data, analyzing, refreshAi]);

  const topLiked = useMemo(
    () => data?.analytics.multiple.q4?.filter((item) => item.value !== "nothing_yet" && item.count > 0).slice(0, 5) ?? [],
    [data],
  );
  const topConcerns = useMemo(() => {
    if (!data) return [];
    return [
      ...(data.analytics.multiple.q5 ?? []).filter((item) => item.value !== "enough"),
      ...(data.analytics.multiple.q6 ?? []).filter((item) => item.value !== "none"),
    ].filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  if (screen === "checking") {
    return (
      <main className="owner-login-page">
        <div className="scene owner-scene" aria-hidden="true"><div className="scene-image" /><div className="noise" /></div>
        <div className="checking-loader"><span />Проверяем доступ</div>
      </main>
    );
  }

  if (screen === "login") {
    return (
      <main className="owner-login-page">
        <div className="scene owner-scene" aria-hidden="true">
          <div className="scene-image" />
          <div className="light-trail light-trail-one" />
          <div className="noise" />
        </div>
        <form className="owner-login" onSubmit={login}>
          <span className="owner-lock"><LockIcon /></span>
          <p className="section-index">ЗАКРЫТАЯ ЗОНА</p>
          <h1>Результаты опроса</h1>
          <p>Введите пароль владельца, чтобы открыть статистику и полные анкеты.</p>
          <label htmlFor="owner-password">Пароль</label>
          <input
            id="owner-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {loginError ? <div className="login-error" role="alert">{loginError}</div> : null}
          <button className="primary-action owner-login-button" disabled={loading} type="submit">
            {loading ? "Открываем…" : "Открыть отчёт"}
          </button>
          <Link href="/">Вернуться к опросу</Link>
        </form>
      </main>
    );
  }

  const analytics = data?.analytics;
  const report = data?.report;
  const positive = analytics?.mood.positive ?? 0;
  const neutral = analytics?.mood.neutral ?? 0;
  const negative = analytics?.mood.negative ?? 0;

  return (
    <main className="results-page">
      <div className="results-backdrop" aria-hidden="true" />
      <aside className="results-sidebar">
        <a className="wordmark" href="/results">NOMAD</a>
        <nav>
          <a className="active" href="#overview">Обзор</a>
          <a href="#ratings">Оценки</a>
          <a href="#summary">ИИ-резюме</a>
          <a href="#responses">Все анкеты</a>
        </nav>
        <div className="sidebar-bottom">
          <span><LockIcon /> Только для владельца</span>
          <button type="button" onClick={logout}>Выйти</button>
        </div>
      </aside>

      <div className="results-main">
        <header className="results-header" id="overview">
          <div>
            <p className="section-index">ЦИКЛ {data?.cycle ?? "—"}</p>
            <h1>Результаты опроса</h1>
          </div>
          <div className="results-actions">
            <div className="updated-at">
              <span>Последнее обновление</span>
              <strong>{formatDate(report?.updatedAt ?? null)}</strong>
            </div>
            <button type="button" onClick={() => void fetchResults()} disabled={loading}>
              <RefreshIcon /> {loading ? "Загрузка…" : "Обновить"}
            </button>
          </div>
        </header>

        {error ? <div className="dashboard-error" role="alert">{error}</div> : null}

        <section className="metric-strip">
          <article className="metric-primary">
            <span>Средняя оценка</span>
            <strong>{analytics?.overallAverage?.toFixed(2) ?? "—"}<small> / 5</small></strong>
            <p>На основе {analytics?.total ?? 0} ответов</p>
          </article>
          <article className="mood-metric">
            <div className="mood-copy">
              <span>Общее настроение</span>
              <div className="mood-numbers">
                <p><b className="positive">{positive}%</b>Положительно</p>
                <p><b className="neutral">{neutral}%</b>Нейтрально</p>
                <p><b className="negative">{negative}%</b>Негативно</p>
              </div>
            </div>
            <div
              className="mood-donut"
              style={{ "--positive": `${positive * 3.6}deg`, "--neutral": `${(positive + neutral) * 3.6}deg` } as CSSProperties}
              aria-label={`Положительно ${positive}%, нейтрально ${neutral}%, негативно ${negative}%`}
            />
          </article>
          <article className="ai-metric">
            <div><span className={`ai-status-dot ${analytics?.pendingAi ? "pending" : ""}`} />ИИ-обработка</div>
            <strong>{Math.max(0, (analytics?.total ?? 0) - (analytics?.pendingAi ?? 0))}<small> / {analytics?.total ?? 0}</small></strong>
            <div className="ai-progress"><span style={{ width: `${analytics?.total ? Math.round(((analytics.total - analytics.pendingAi) / analytics.total) * 100) : 0}%` }} /></div>
            <p>{report?.provider || "Провайдер не настроен"}</p>
            {analytics?.pendingAi ? (
              <button type="button" onClick={() => void refreshAi()} disabled={analyzing}>
                {analyzing ? "Анализируем…" : `Обработать ${analytics.pendingAi}`}
              </button>
            ) : null}
          </article>
        </section>

        <section className="analytics-grid" id="ratings">
          <article className="panel ratings-panel">
            <div className="panel-heading">
              <div><p className="section-index">ЧИСЛОВЫЕ ДАННЫЕ</p><h2>Оценки по вопросам</h2></div>
              <span>{analytics?.ratings.length ?? 0} показателей</span>
            </div>
            <div className="rating-table">
              {analytics?.ratings.map((metric) => {
                const total = Math.max(1, metric.answered);
                return (
                  <div className="rating-row-result" key={metric.questionId}>
                    <div className="rating-result-title"><span>{metric.questionId.slice(1)}</span><p>{metric.title}</p></div>
                    <strong>{metric.average?.toFixed(2) ?? "—"}</strong>
                    <div className="distribution-bar" aria-label={`Средняя оценка ${metric.average ?? "нет"}`}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <i
                          className={`distribution-${rating}`}
                          key={rating}
                          style={{ width: `${((metric.distribution[String(rating)] ?? 0) / total) * 100}%` }}
                          title={`${rating}: ${metric.distribution[String(rating)] ?? 0}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="distribution-legend"><span>1 — плохо</span><span>5 — отлично</span></div>
          </article>

          <div className="ranked-columns">
            <article className="panel ranked-panel liked-panel">
              <div className="panel-heading"><h2>Что нравится</h2><span>Топ-5</span></div>
              <ol>{topLiked.map((item) => <li key={item.value}><span>{item.label}</span><b>{item.percent}%</b></li>)}</ol>
              {!topLiked.length ? <p className="empty-state">Пока нет данных</p> : null}
            </article>
            <article className="panel ranked-panel concern-panel">
              <div className="panel-heading"><h2>Что требует внимания</h2><span>Топ-5</span></div>
              <ol>{topConcerns.map((item) => <li key={`${item.value}-${item.label}`}><span>{item.label}</span><b>{item.percent}%</b></li>)}</ol>
              {!topConcerns.length ? <p className="empty-state">Пока нет данных</p> : null}
            </article>
          </div>
        </section>

        <section className="panel ai-summary" id="summary">
          <div className="summary-mark" aria-hidden="true">✦</div>
          <div className="summary-main">
            <div className="panel-heading">
              <div><p className="section-index">ОБРАБОТАНО ИИ</p><h2>Общее резюме</h2></div>
              <span>{report?.processedResponses ?? 0} текстовых ответов</span>
            </div>
            <p className="summary-text">
              {report?.summary || "Сводка появится после первого свободного комментария и подключения Groq или NVIDIA."}
            </p>
            <div className="summary-lists">
              <div><h3>Сильные стороны</h3><ul>{report?.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>Проблемы</h3><ul>{report?.concerns.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3>Что сделать</h3><ul>{report?.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
          </div>
          <div className="theme-bars">
            <h3>Темы комментариев</h3>
            {report?.themes.slice(0, 7).map((theme) => {
              const max = Math.max(1, ...(report?.themes.map((item) => item.count) ?? [1]));
              return (
                <div className="theme-row" key={theme.name}>
                  <span>{theme.name}</span>
                  <i><b className={`theme-${theme.sentiment}`} style={{ width: `${(theme.count / max) * 100}%` }} /></i>
                  <strong>{theme.count}</strong>
                </div>
              );
            })}
            {!report?.themes.length ? <p className="empty-state">Темы появятся после обработки текста</p> : null}
          </div>
        </section>

        <section className="responses-section" id="responses">
          <div className="responses-heading">
            <div><p className="section-index">ИСХОДНЫЕ ДАННЫЕ</p><h2>Все анкеты</h2></div>
            <span>{analytics?.total ?? 0}</span>
          </div>
          <div className="response-list">
            {data?.responses.map((response) => (
              <details className="response-item" key={response.id}>
                <summary>
                  <span className="response-id">#{response.id}</span>
                  <span>{formatDate(response.submittedAt)}</span>
                  <strong>{response.scoreAverage?.toFixed(2) ?? "—"} / 5</strong>
                  <span className={`sentiment sentiment-${response.aiSentiment || "pending"}`}>
                    {sentimentLabel(response.aiStatus, response.aiSentiment)}
                  </span>
                  <ChevronIcon />
                </summary>
                <div className="response-detail">
                  {response.aiDigest ? <div className="response-digest"><span>Краткий смысл ИИ</span><p>{response.aiDigest}</p></div> : null}
                  <dl>
                    {SURVEY_QUESTIONS.map((question) => (
                      <div key={question.id}>
                        <dt>{question.number}. {question.title}</dt>
                        <dd><ResponseAnswer response={response} questionId={question.id} /></dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ))}
            {!data?.responses.length ? <div className="responses-empty">Пока никто не заполнил опрос</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

