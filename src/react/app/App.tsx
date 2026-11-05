import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';
import { useDocumentLanguage } from './hooks/useDocumentLanguage';
import { useTheme } from './hooks/useTheme';
import './i18n/i18n';
import { CatalogPage } from '../pages/catalog';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

const EgyptSlotPage = lazy(() =>
  import('../pages/egypt-slot/EgyptSlotPage').then(({ EgyptSlotPage }) => ({
    default: EgyptSlotPage,
  })),
);

function App() {
  const { i18n: activeI18n } = useTranslation();
  const language = activeI18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ru';
  const { theme, toggleTheme } = useTheme();
  useDocumentLanguage(language);

  return (
    <Routes>
      <Route
        path="/"
        element={<CatalogPage language={language} theme={theme} onThemeToggle={toggleTheme} />}
      />
      <Route
        path="/games/egypt-slot"
        element={
          <Suspense fallback={null}>
            <EgyptSlotPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={<NotFoundPage language={language} theme={theme} onThemeToggle={toggleTheme} />}
      />
    </Routes>
  );
}

export default App;
