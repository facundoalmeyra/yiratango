import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ArtistsLanding from './pages/ArtistsLanding';
import About from './pages/About';
import Contact from './pages/Contact';
import ClaimProfile from './pages/ClaimProfile';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // 'auth_required' and other errors: just render the app normally (public app)
  }

  // Render the main app
  const renderRoutes = () => (
    <>
      <Route index element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={path}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="artists" element={
        <LayoutWrapper currentPageName="artists">
          <ArtistsLanding />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </>
  );

  return (
    <Routes>
      <Route path="/en">
        {renderRoutes()}
        <Route path="claim" element={<LayoutWrapper currentPageName="claim"><ClaimProfile /></LayoutWrapper>} />
      </Route>
      <Route path="/es">
        {renderRoutes()}
        <Route path="claim" element={<LayoutWrapper currentPageName="claim"><ClaimProfile /></LayoutWrapper>} />
      </Route>

      <Route path="/" element={
        <LayoutWrapper currentPageName="ArtistsLanding">
          <ArtistsLanding />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={path}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="artists" element={
        <LayoutWrapper currentPageName="artists">
          <ArtistsLanding />
        </LayoutWrapper>
      } />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="claim" element={<LayoutWrapper currentPageName="claim"><ClaimProfile /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App