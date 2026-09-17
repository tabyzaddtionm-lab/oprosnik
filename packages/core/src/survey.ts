export type QuestionType = "single" | "multiple" | "rating" | "text";

export interface SurveyQuestion {
  id: string;
  number: number;
  type: QuestionType;
  title: string;
  description?: string;
  options?: { value: string; label: string }[];
  required: boolean;
  lowLabel?: string;
  highLabel?: string;
  notApplicable?: { value: string; label: string };
  exclusiveValues?: string[];
  maxLength?: number;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    number: 1,
    type: "single",
    title: "Какими услугами NOMAD вы пользовались?",
    required: true,
    options: [
      { value: "driving", label: "Обучение вождению" },
      { value: "exam", label: "Пробный экзамен" },
      { value: "both", label: "Обучение вождению и пробный экзамен" },
      { value: "information", label: "Только узнавал об услугах или записывался" },
    ],
  },
  {
    id: "q2",
    number: 2,
    type: "rating",
    title: "Какое общее впечатление у вас осталось от взаимодействия с NOMAD?",
    required: true,
    lowLabel: "Очень плохое",
    highLabel: "Отличное",
  },
  {
    id: "q3",
    number: 3,
    type: "rating",
    title: "Насколько вы в целом довольны услугами и организацией работы NOMAD?",
    required: true,
    lowLabel: "Совсем не доволен",
    highLabel: "Полностью доволен",
  },
  {
    id: "q4",
    number: 4,
    type: "multiple",
    title: "Что в работе NOMAD вам нравится?",
    description: "Можно выбрать несколько вариантов",
    required: true,
    exclusiveValues: ["nothing_yet"],
    options: [
      { value: "instructor_attitude", label: "Отношение инструкторов" },
      { value: "clear_explanations", label: "Понятное объяснение на занятиях" },
      { value: "booking", label: "Удобство записи" },
      { value: "time_choice", label: "Возможность подобрать время" },
      { value: "support", label: "Работа администраторов и поддержки" },
      { value: "vehicles", label: "Состояние автомобилей" },
      { value: "exam", label: "Организация пробного экзамена" },
      { value: "price", label: "Стоимость услуг" },
      { value: "digital", label: "Удобство приложения или Telegram-бота" },
      { value: "nothing_yet", label: "Пока ничего особенно не могу отметить" },
    ],
  },
  {
    id: "q5",
    number: 5,
    type: "multiple",
    title: "Чего вам не хватило в работе NOMAD?",
    description: "Можно выбрать несколько вариантов",
    required: true,
    exclusiveValues: ["enough"],
    options: [
      { value: "faster_feedback", label: "Более быстрой обратной связи" },
      { value: "clearer_information", label: "Более понятной информации об услугах и записи" },
      { value: "more_slots", label: "Большего выбора свободного времени" },
      { value: "easier_changes", label: "Более удобного переноса или отмены записи" },
      { value: "progress_feedback", label: "Обратной связи о результатах занятий" },
      { value: "more_explanations", label: "Дополнительных пояснений со стороны инструктора" },
      { value: "more_attention", label: "Более внимательного отношения" },
      { value: "better_digital", label: "Более удобной работы приложения или Telegram-бота" },
      { value: "enough", label: "Всего необходимого хватило" },
    ],
  },
  {
    id: "q6",
    number: 6,
    type: "multiple",
    title: "Что сейчас доставляет вам наибольшее неудобство?",
    description: "Можно выбрать несколько вариантов",
    required: true,
    exclusiveValues: ["none"],
    options: [
      { value: "contact", label: "Сложно связаться с администратором или получить ответ" },
      { value: "time", label: "Сложно подобрать удобное время" },
      { value: "cancellations", label: "Переносы или отмены занятий" },
      { value: "punctuality", label: "Опоздания или несоблюдение договорённостей" },
      { value: "information", label: "Недостаточно информации перед услугой" },
      { value: "instructor", label: "Не устраивает взаимодействие с инструктором" },
      { value: "vehicle", label: "Не устраивает состояние автомобиля" },
      { value: "exam", label: "Не устраивает организация пробного экзамена" },
      { value: "none", label: "Существенных неудобств не было" },
    ],
  },
  {
    id: "q7",
    number: 7,
    type: "rating",
    title: "Как вы оцениваете работу администраторов и поддержки?",
    required: true,
    lowLabel: "Очень плохо",
    highLabel: "Отлично",
    notApplicable: { value: "na", label: "Не могу оценить" },
  },
  {
    id: "q8",
    number: 8,
    type: "rating",
    title: "Насколько удобно записываться на занятия или пробный экзамен?",
    required: true,
    lowLabel: "Очень неудобно",
    highLabel: "Очень удобно",
    notApplicable: { value: "na", label: "Не могу оценить" },
  },
  {
    id: "q9",
    number: 9,
    type: "rating",
    title: "Насколько соблюдаются согласованные время и условия записи?",
    required: true,
    lowLabel: "Почти никогда",
    highLabel: "Всегда",
    notApplicable: { value: "na", label: "Не могу оценить" },
  },
  {
    id: "q10",
    number: 10,
    type: "rating",
    title: "Насколько понятно инструктор объясняет упражнения и ошибки?",
    required: true,
    lowLabel: "Совсем непонятно",
    highLabel: "Очень понятно",
    notApplicable: { value: "na", label: "Не занимался с инструктором" },
  },
  {
    id: "q11",
    number: 11,
    type: "rating",
    title: "Насколько внимательно и корректно инструктор с вами взаимодействует?",
    required: true,
    lowLabel: "Очень плохо",
    highLabel: "Отлично",
    notApplicable: { value: "na", label: "Не занимался с инструктором" },
  },
  {
    id: "q12",
    number: 12,
    type: "rating",
    title: "Как вы оцениваете состояние и чистоту автомобиля NOMAD?",
    required: true,
    lowLabel: "Очень плохо",
    highLabel: "Отлично",
    notApplicable: { value: "na", label: "Не пользовался автомобилем NOMAD" },
  },
  {
    id: "q13",
    number: 13,
    type: "rating",
    title: "Насколько стоимость услуги соответствует полученному качеству?",
    required: true,
    lowLabel: "Совсем не соответствует",
    highLabel: "Полностью соответствует",
    notApplicable: { value: "na", label: "Не пользовался платной услугой" },
  },
  {
    id: "q14",
    number: 14,
    type: "text",
    title: "Что в работе NOMAD нам необходимо улучшить в первую очередь?",
    description: "Напишите своими словами — ответ обработает ИИ и добавит в общую сводку",
    required: true,
    maxLength: 1500,
  },
  {
    id: "q15",
    number: 15,
    type: "text",
    title: "Опишите конкретную ситуацию или оставьте дополнительный комментарий",
    description: "Необязательно. Не указывайте имя, телефон и другие личные данные",
    required: false,
    maxLength: 2000,
  },
];

export const REQUIRED_QUESTIONS = SURVEY_QUESTIONS.filter((question) => question.required);

export const QUESTION_BY_ID = Object.fromEntries(
  SURVEY_QUESTIONS.map((question) => [question.id, question]),
) as Record<string, SurveyQuestion>;

export const RATING_QUESTION_IDS = SURVEY_QUESTIONS.filter(
  (question) => question.type === "rating",
).map((question) => question.id);

export const MULTIPLE_QUESTION_IDS = SURVEY_QUESTIONS.filter(
  (question) => question.type === "multiple",
).map((question) => question.id);

export type SurveyAnswers = Record<string, string | string[]>;

export function optionLabel(questionId: string, value: string): string {
  const question = QUESTION_BY_ID[questionId];
  if (!question) return value;
  if (question.notApplicable?.value === value) return question.notApplicable.label;
  return question.options?.find((option) => option.value === value)?.label ?? value;
}


