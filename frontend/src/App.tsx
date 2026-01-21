import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { VideoListPage } from './pages/VideoListPage';
import { UploadPage } from './pages/UploadPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { SearchPage } from './pages/SearchPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark min-h-screen">
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/videos" element={<VideoListPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/videos/:videoId" element={<VideoDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
