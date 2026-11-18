import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { enUS, id as idLocale, type Locale } from "date-fns/locale"

import idCommon from "@/locales/id/common.json"
import idSetting from "@/locales/id/setting.json"
import idAuth from "@/locales/id/auth.json"
import idSetup from "@/locales/id/setup.json"
import idComingSoon from "@/locales/id/comingSoon.json"
import idNotFound from "@/locales/id/notFound.json"
import idHome from "@/locales/id/home.json"
import idChat from "@/locales/id/chat.json"
import idSpace from "@/locales/id/space.json"
import idInsight from "@/locales/id/insight.json"
import idJournal from "@/locales/id/journal.json"
import idJournalDetail from "@/locales/id/journalDetail.json"
import idQuizSummary from "@/locales/id/quizSummary.json"
import idLocationSharing from "@/locales/id/locationSharing.json"
import idNotification from "@/locales/id/notification.json"
import idProfileSetting from "@/locales/id/profileSetting.json"
import idMoodSetting from "@/locales/id/moodSetting.json"
import idNudgeSetting from "@/locales/id/nudgeSetting.json"
import idImportantDatesSetting from "@/locales/id/importantDatesSetting.json"
import idAppAppearanceSetting from "@/locales/id/appAppearanceSetting.json"

import enCommon from "@/locales/en/common.json"
import enSetting from "@/locales/en/setting.json"
import enAuth from "@/locales/en/auth.json"
import enSetup from "@/locales/en/setup.json"
import enComingSoon from "@/locales/en/comingSoon.json"
import enNotFound from "@/locales/en/notFound.json"
import enHome from "@/locales/en/home.json"
import enChat from "@/locales/en/chat.json"
import enSpace from "@/locales/en/space.json"
import enInsight from "@/locales/en/insight.json"
import enJournal from "@/locales/en/journal.json"
import enJournalDetail from "@/locales/en/journalDetail.json"
import enQuizSummary from "@/locales/en/quizSummary.json"
import enLocationSharing from "@/locales/en/locationSharing.json"
import enNotification from "@/locales/en/notification.json"
import enProfileSetting from "@/locales/en/profileSetting.json"
import enMoodSetting from "@/locales/en/moodSetting.json"
import enNudgeSetting from "@/locales/en/nudgeSetting.json"
import enImportantDatesSetting from "@/locales/en/importantDatesSetting.json"
import enAppAppearanceSetting from "@/locales/en/appAppearanceSetting.json"

export const LANGUAGE_STORAGE_KEY = "fiora-language"
export const SUPPORTED_LANGUAGES = ["id", "en"] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: AppLanguage = "id"

export function isSupportedLanguage(value: string | null): value is AppLanguage {
  return value === "id" || value === "en"
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLanguage(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors
  }

  return DEFAULT_LANGUAGE
}

function syncDocumentLanguage(language: AppLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language
  }
}

export const resources = {
  id: {
    common: idCommon,
    setting: idSetting,
    auth: idAuth,
    setup: idSetup,
    comingSoon: idComingSoon,
    notFound: idNotFound,
    home: idHome,
    chat: idChat,
    space: idSpace,
    insight: idInsight,
    journal: idJournal,
    journalDetail: idJournalDetail,
    quizSummary: idQuizSummary,
    locationSharing: idLocationSharing,
    notification: idNotification,
    profileSetting: idProfileSetting,
    moodSetting: idMoodSetting,
    nudgeSetting: idNudgeSetting,
    importantDatesSetting: idImportantDatesSetting,
    appAppearanceSetting: idAppAppearanceSetting,
  },
  en: {
    common: enCommon,
    setting: enSetting,
    auth: enAuth,
    setup: enSetup,
    comingSoon: enComingSoon,
    notFound: enNotFound,
    home: enHome,
    chat: enChat,
    space: enSpace,
    insight: enInsight,
    journal: enJournal,
    journalDetail: enJournalDetail,
    quizSummary: enQuizSummary,
    locationSharing: enLocationSharing,
    notification: enNotification,
    profileSetting: enProfileSetting,
    moodSetting: enMoodSetting,
    nudgeSetting: enNudgeSetting,
    importantDatesSetting: enImportantDatesSetting,
    appAppearanceSetting: enAppAppearanceSetting,
  },
} as const

const initialLanguage = getInitialLanguage()
syncDocumentLanguage(initialLanguage)

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: [
    "common",
    "setting",
    "auth",
    "setup",
    "comingSoon",
    "notFound",
    "home",
    "chat",
    "space",
    "insight",
    "journal",
    "journalDetail",
    "quizSummary",
    "locationSharing",
    "notification",
    "profileSetting",
    "moodSetting",
    "nudgeSetting",
    "importantDatesSetting",
    "appAppearanceSetting",
  ],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on("languageChanged", (lng) => {
  const nextLanguage = isSupportedLanguage(lng) ? lng : DEFAULT_LANGUAGE
  syncDocumentLanguage(nextLanguage)
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    } catch {
      // Ignore storage access errors
    }
  }
})

export function getCurrentLanguage(): AppLanguage {
  return isSupportedLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
}

export function getDateFnsLocale(language?: string): Locale {
  const resolved = language ?? i18n.language
  return resolved === "en" ? enUS : idLocale
}

export default i18n
