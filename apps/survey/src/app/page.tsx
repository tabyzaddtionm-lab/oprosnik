import Image from "next/image";

import { SurveyForm } from "@/components/SurveyForm";

export default function SurveyPage() {
  return (
    <main className="survey-page">
      <div className="scene" aria-hidden="true">
        <div className="scene-image" />
        <div className="light-trail light-trail-one" />
        <div className="light-trail light-trail-two" />
        <div className="road-line" />
        <div className="noise" />
      </div>

      <header className="public-header">
        <a className="wordmark" href="#top" aria-label="NOMAD, к началу страницы">
          <Image
            className="brand-logo"
            src="/nomad-logo.png"
            alt="NOMAD"
            width={60}
            height={59}
            priority
          />
        </a>
        <div className="header-note">
          <span className="privacy-dot" />
          Без имени и телефона
        </div>
      </header>

      <section className="survey-hero" id="top">
        <h1>Ваше мнение меняет наш сервис</h1>
        <p>
          Расскажите, что в NOMAD вам нравится и что стоит улучшить. Ваш опыт помогает нам
          становиться лучше.
        </p>
        <div className="hero-meta">
          <span>Анонимно</span>
          <i />
          <span>Около 3 минут</span>
          <i />
          <span>15 вопросов</span>
        </div>
      </section>

      <SurveyForm />

      <footer className="public-footer">
        <span className="wordmark wordmark-small">NOMAD</span>
        <p>АвтоПрактик NOMAD · Павлодар</p>
      </footer>
    </main>
  );
}

