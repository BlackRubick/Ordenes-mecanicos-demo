import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';

const SCROLL_KEY_PREFIX = 'dashboard_scroll:';
const WINDOW_SCROLL_KEY_PREFIX = 'dashboard_window_scroll:';
const SCROLL_DEBUG = true;

const debugScroll = (...args) => {
  if (!SCROLL_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[SCROLL_DEBUG][DashboardLayout]', ...args);
};

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const scrollContainerRef = React.useRef(null);

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const storageKey = `${SCROLL_KEY_PREFIX}${location.pathname}`;
    const windowStorageKey = `${WINDOW_SCROLL_KEY_PREFIX}${location.pathname}`;
    const savedValue = sessionStorage.getItem(storageKey);
    const savedWindowValue = sessionStorage.getItem(windowStorageKey);
    const savedScrollTop = Number(savedValue);
    const savedWindowScroll = Number(savedWindowValue);

    debugScroll('mount', {
      pathname: location.pathname,
      storageKey,
      savedScrollTop,
      savedWindowScroll,
      containerClientHeight: scrollContainer.clientHeight,
      containerScrollHeight: scrollContainer.scrollHeight,
    });

    if (Number.isFinite(savedScrollTop) && savedScrollTop > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = savedScrollTop;
          debugScroll('restored container scroll', {
            pathname: location.pathname,
            restored: savedScrollTop,
            actual: scrollContainer.scrollTop,
          });
        });
      });
    }

    if (Number.isFinite(savedWindowScroll) && savedWindowScroll > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedWindowScroll, behavior: 'auto' });
          debugScroll('restored window scroll', {
            pathname: location.pathname,
            restored: savedWindowScroll,
            actual: window.scrollY || window.pageYOffset || 0,
          });
        });
      });
    }

    const persistScroll = () => {
      const containerValue = scrollContainer.scrollTop || 0;
      const windowValue = window.scrollY || window.pageYOffset || 0;
      sessionStorage.setItem(storageKey, String(containerValue));
      sessionStorage.setItem(windowStorageKey, String(windowValue));
      debugScroll('persist', {
        pathname: location.pathname,
        containerValue,
        windowValue,
      });
    };

    // Persist as user scrolls so route transitions do not rely on unmount timing.
    const handleScroll = () => persistScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Ensure restored value is available even if user navigates without additional scrolling.
    persistScroll();

    const handlePageHide = () => persistScroll();
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [location.pathname]);

  const { role } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return (
    <div data-role={normalizedRole} className="min-h-screen flex flex-col fade-in relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(27,42,59,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(232,80,10,0.08),transparent_28%),linear-gradient(180deg,#f7f8fa_0%,#f4f6f8_100%)]" />
      <Navbar />
      <main className="relative z-10 flex-1 flex flex-col gap-6 pt-24 px-4 pb-4">
        <section id="dashboard-scroll-container" ref={scrollContainerRef} className="mt-4 flex-1 rounded-[28px] border border-white/60 bg-white/82 shadow-[0_18px_60px_rgba(27,42,59,0.08)] backdrop-blur-xl pt-10 p-6 overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
