import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Routes, Route, useParams } from 'react-router'
import { LanguageProvider } from '@/i18n/LanguageContext'
import { BookingRoomProvider } from '@/hooks/useBookingRoom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Analytics from '@/components/Analytics'
import FloatingButtons from '@/components/FloatingButtons'
import ThemeController from '@/components/ThemeController'
import NoIndex from '@/components/NoIndex'

const Account = lazy(() => import('./pages/Account'))
const Admin = lazy(() => import('./pages/Admin'))
const Payment = lazy(() => import('./pages/Payment'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Login = lazy(() => import('./pages/Login'))

const PUBLIC_LOCALES = new Set(['pt', 'en', 'es', 'fr', 'ar', 'zh', 'ja'])

function LocalizedHome() {
  const { locale } = useParams()
  if (!locale || !PUBLIC_LOCALES.has(locale)) return <NotFound />
  return <Home />
}

function PrivatePage({ children }: { children: ReactNode }) {
  return (
    <>
      <NoIndex />
      {children}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <BookingRoomProvider>
        <ThemeController />
        <Analytics />
        <FloatingButtons />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/pt/" replace />} />
            <Route path="/:locale/" element={<LocalizedHome />} />
            <Route path="/conta" element={<PrivatePage><Account /></PrivatePage>} />
            <Route path="/admin" element={<PrivatePage><Admin /></PrivatePage>} />
            <Route path="/pagamento" element={<PrivatePage><Payment /></PrivatePage>} />
            <Route path="/redefinir-senha" element={<PrivatePage><ResetPassword /></PrivatePage>} />
            <Route path="/login" element={<PrivatePage><Login /></PrivatePage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BookingRoomProvider>
    </LanguageProvider>
  )
}
